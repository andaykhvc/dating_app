-- 999993_photo_moderation.sql
-- Profile photo moderation (issue #49): every photo has a status; other people
-- only ever see 'approved' ones. Automatic checks (issue #50) plug into the same
-- approve_photo / reject_photo functions.
--
-- Backfill: every photo that exists when this migration runs is grandfathered as
-- 'approved' (moderation_source = 'manual', moderated_at = now()). They were
-- visible before and nobody has reviewed them; docs/compliance/moderation-runbook.md
-- has a query to list them for an optional later pass.
--
-- Read paths changed (everything that shows someone else's photo):
--   * profiles.primary_photo_path, written by sync_primary_photo(): now the
--     first APPROVED photo by position, null when there is none. Every list that
--     shows an avatar reads this column: discover_profiles, get_matches,
--     get_play_overview (mission partners), get_xp_leaderboard, the chat header
--     and match lists. They need no change of their own.
--   * discover_profiles(): additionally skips profiles with no approved photo.
--   * get_profile_card(): the gallery lists only approved photos (the owner sees
--     all of their own, with their status).
-- Owners read their own photos straight from profile_photos (RLS: own rows).

alter table public.profile_photos
  add column moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  add column moderated_at timestamptz,
  add column moderation_reason text,
  add column moderation_source text
    check (moderation_source in ('manual', 'auto'));

-- Grandfather what exists.
update public.profile_photos
set moderation_status = 'approved',
    moderated_at = now(),
    moderation_source = 'manual';

create index profile_photos_moderation_queue_idx
  on public.profile_photos (created_at)
  where moderation_status = 'pending';

-- Clients may write the photo itself, never its moderation state. With column
-- grants, an attempt to set moderation_* fails with "permission denied".
revoke insert, update on public.profile_photos from authenticated;
grant insert (user_id, storage_path, position) on public.profile_photos to authenticated;
grant update (storage_path, position) on public.profile_photos to authenticated;

-- A different file is a different photo: swapping storage_path puts the row back
-- in review whatever its old status was.
create or replace function public.reset_photo_moderation_on_replace()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.storage_path is distinct from old.storage_path then
    new.moderation_status := 'pending';
    new.moderated_at := null;
    new.moderation_reason := null;
    new.moderation_source := null;
  end if;
  return new;
end;
$$;

create trigger profile_photos_reset_moderation
  before update on public.profile_photos
  for each row execute function public.reset_photo_moderation_on_replace();

-- primary_photo_path = the first approved photo, or null.
create or replace function public.sync_primary_photo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
begin
  update profiles p
  set primary_photo_path = (
    select storage_path from profile_photos
    where user_id = v_user_id and moderation_status = 'approved'
    order by position
    limit 1
  )
  where p.id = v_user_id;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Manual review (SQL editor / service role only; see the runbook)
-- ---------------------------------------------------------------------------

create or replace function public.approve_photo(p_photo_id uuid, p_source text default 'manual')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source not in ('manual', 'auto') then
    raise exception 'Invalid moderation source' using errcode = 'check_violation';
  end if;

  update profile_photos
  set moderation_status = 'approved',
      moderated_at = now(),
      moderation_reason = null,
      moderation_source = p_source
  where id = p_photo_id and moderation_status = 'pending';

  if not found then
    raise exception 'Photo % is not pending (or does not exist)', p_photo_id using errcode = 'no_data_found';
  end if;
end;
$$;

-- Marks the photo rejected. The FILE is not removed here: SQL deletes on
-- storage.objects do not remove the stored object. Use
-- scripts/moderation/reject-photo.mjs, which calls this and then removes the
-- files through the Storage API.
create or replace function public.reject_photo(p_photo_id uuid, p_reason text, p_source text default 'manual')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  if p_source not in ('manual', 'auto') then
    raise exception 'Invalid moderation source' using errcode = 'check_violation';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required' using errcode = 'check_violation';
  end if;

  update profile_photos
  set moderation_status = 'rejected',
      moderated_at = now(),
      moderation_reason = left(trim(p_reason), 200),
      moderation_source = p_source
  where id = p_photo_id and moderation_status in ('pending', 'approved')
  returning storage_path into v_path;

  if v_path is null then
    raise exception 'Photo % was not found or is already rejected', p_photo_id using errcode = 'no_data_found';
  end if;

  return v_path;
end;
$$;

revoke execute on function public.approve_photo(uuid, text) from public, anon, authenticated;
revoke execute on function public.reject_photo(uuid, text, text) from public, anon, authenticated;

-- Pending photos, oldest first. Prepend <project url>/storage/v1/object/public/
-- to storage_path to view one. Not readable by API roles.
create or replace view public.moderation_photo_queue
with (security_invoker = true) as
select ph.id as photo_id,
       ph.user_id,
       p.first_name,
       ph.position,
       ph.storage_path,
       'storage/v1/object/public/profile-photos/' || ph.storage_path as public_url_path,
       ph.created_at
from public.profile_photos ph
join public.profiles p on p.id = ph.user_id
where ph.moderation_status = 'pending'
order by ph.created_at;

revoke all on public.moderation_photo_queue from public, anon, authenticated;

-- Existing owners' rows get their primary photo recomputed (a no-op for the
-- grandfathered rows, but keeps the invariant explicit).
update public.profiles p
set primary_photo_path = (
  select storage_path from public.profile_photos
  where user_id = p.id and moderation_status = 'approved'
  order by position limit 1
)
where exists (select 1 from public.profile_photos where user_id = p.id);

-- discover_profiles and get_profile_card: same bodies as 0012 with the photo rules above.
create or replace function public.discover_profiles(p_limit int default 10)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_me record;
  v_my_age int;
  v_native text;
  v_learning text;
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_me from profiles where id = v_uid;
  if v_me is null or v_me.onboarding_completed_at is null then
    return '[]'::jsonb;
  end if;

  v_my_age := public.profile_age(v_me.date_of_birth);

  select language_code into v_native
  from user_languages where user_id = v_uid and role = 'native' limit 1;

  select language_code into v_learning
  from user_languages where user_id = v_uid and role = 'learning' limit 1;

  select coalesce(
    jsonb_agg(c.card order by c.language_match desc, c.created_at desc),
    '[]'::jsonb
  )
  into v_result
  from (
    select
      p.created_at,
      -- A partner is "relevant" when the pairing teaches somebody something:
      -- they speak what you are learning, or they are learning what you speak.
      (
        exists (
          select 1 from user_languages ul
          where ul.user_id = p.id and ul.role = 'native' and ul.language_code = v_learning
        )
        or exists (
          select 1 from user_languages ul
          where ul.user_id = p.id and ul.role = 'learning' and ul.language_code = v_native
        )
      ) as language_match,
      jsonb_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'age', public.profile_age(p.date_of_birth),
        'country_code', p.country_code,
        'city', p.city,
        'bio', p.bio,
        'intentions', to_jsonb(p.intentions),
        'primary_photo_path', p.primary_photo_path,
        'is_photo_verified', p.is_photo_verified,
        'languages', coalesce((
          select jsonb_agg(jsonb_build_object(
            'role', ul.role,
            'language_code', ul.language_code,
            'language_name', l.name,
            'flag_emoji', l.flag_emoji,
            'cefr_level', ul.cefr_level
          ) order by ul.role)
          from user_languages ul
          join languages l on l.code = ul.language_code
          where ul.user_id = p.id
        ), '[]'::jsonb),
        'interests', coalesce((
          select jsonb_agg(jsonb_build_object('key', t.key, 'label', t.label, 'emoji', t.emoji))
          from (
            select i.key, i.label, i.emoji
            from user_interests ui
            join interests i on i.id = ui.interest_id
            where ui.user_id = p.id
            order by i.id
            limit 4
          ) t
        ), '[]'::jsonb)
      ) as card
    from profiles p
    where p.id <> v_uid
      and p.account_status = 'active'
      and p.onboarding_completed_at is not null
      -- Nobody is shown before at least one of their photos is approved.
      and p.primary_photo_path is not null
      and not exists (
        select 1 from swipes s where s.swiper_id = v_uid and s.swipee_id = p.id
      )
      and not exists (
        select 1 from blocks b
        where (b.blocker_id = v_uid and b.blocked_id = p.id)
           or (b.blocker_id = p.id and b.blocked_id = v_uid)
      )
      -- Age preference has to hold in both directions or the match can't happen.
      and public.profile_age(p.date_of_birth)
          between v_me.preferred_age_min and v_me.preferred_age_max
      and v_my_age between p.preferred_age_min and p.preferred_age_max
      and (
        coalesce(array_length(v_me.preferred_countries, 1), 0) = 0
        or p.country_code = any (v_me.preferred_countries)
      )
      and (
        coalesce(array_length(p.preferred_countries, 1), 0) = 0
        or v_me.country_code = any (p.preferred_countries)
      )
      -- "Language Buddy only" mode hides everyone open to dating.
      and (
        not v_me.hide_dating_profiles
        or not ('open_to_dating' = any (p.intentions))
      )
    order by
      (
        exists (
          select 1 from user_languages ul
          where ul.user_id = p.id and ul.role = 'native' and ul.language_code = v_learning
        )
        or exists (
          select 1 from user_languages ul
          where ul.user_id = p.id and ul.role = 'learning' and ul.language_code = v_native
        )
      ) desc,
      p.created_at desc
    limit greatest(1, least(p_limit, 30))
  ) c;

  return v_result;
end;
$$;


create or replace function public.get_profile_card(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_p record;
  v_visible boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_p from profiles where id = p_user_id;
  if v_p is null then
    return null;
  end if;

  if exists (
    select 1 from blocks
    where (blocker_id = v_uid and blocked_id = p_user_id)
       or (blocker_id = p_user_id and blocked_id = v_uid)
  ) then
    return null;
  end if;

  v_visible := p_user_id = v_uid
    or (v_p.account_status = 'active' and v_p.onboarding_completed_at is not null)
    or exists (
      select 1 from matches
      where user_a = least(v_uid, p_user_id)
        and user_b = greatest(v_uid, p_user_id)
    );

  if not v_visible then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_p.id,
    'first_name', v_p.first_name,
    'age', public.profile_age(v_p.date_of_birth),
    'country_code', v_p.country_code,
    'city', v_p.city,
    'bio', v_p.bio,
    'intentions', to_jsonb(v_p.intentions),
    'primary_photo_path', v_p.primary_photo_path,
    'is_photo_verified', v_p.is_photo_verified,
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('id', ph.id, 'storage_path', ph.storage_path)
                       order by ph.position)
      from profile_photos ph
      where ph.user_id = v_p.id
        and (ph.moderation_status = 'approved' or v_p.id = v_uid)
    ), '[]'::jsonb),
    'languages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'role', ul.role,
        'language_code', ul.language_code,
        'language_name', l.name,
        'flag_emoji', l.flag_emoji,
        'cefr_level', ul.cefr_level
      ) order by ul.role)
      from user_languages ul
      join languages l on l.code = ul.language_code
      where ul.user_id = v_p.id
    ), '[]'::jsonb),
    'interests', coalesce((
      select jsonb_agg(jsonb_build_object('key', i.key, 'label', i.label, 'emoji', i.emoji)
                       order by i.id)
      from user_interests ui
      join interests i on i.id = ui.interest_id
      where ui.user_id = v_p.id
    ), '[]'::jsonb),
    'progress', (
      select jsonb_build_object('level', up.level, 'league', up.league)
      from user_progress up where up.user_id = v_p.id
    )
  );
end;
$$;

