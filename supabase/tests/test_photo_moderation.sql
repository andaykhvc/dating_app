-- Profile photo moderation (issue #49). Rolled back afterwards.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

create function pg_temp.raises(sql text, expected_state text, message text) returns void
language plpgsql as $$
begin
  execute sql;
  raise exception 'FAILED (no error raised): %', message;
exception when others then
  if sqlstate = 'P0001' and sqlerrm like 'FAILED (no error raised)%' then raise; end if;
  if sqlstate <> expected_state then
    raise exception 'FAILED (got % %): %', sqlstate, sqlerrm, message;
  end if;
end;
$$;

-- Keep results independent of fixtures left by other suites.
update public.profiles set account_status = 'suspended';

-- Viewer V, owner O (completed profiles, matched languages), plus an old user G
-- whose photo existed before moderation (inserted as 'approved' to mimic the backfill).
insert into auth.users (id, raw_user_meta_data) values
  ('b1000000-0000-0000-0000-000000000001', '{"first_name":"Viewer"}'),
  ('b1000000-0000-0000-0000-000000000002', '{"first_name":"Owner"}');
insert into public.user_languages (user_id, language_code, role, cefr_level)
select id, 'en', 'native', null from public.profiles where id::text like 'b1000000-%';
insert into public.user_languages (user_id, language_code, role, cefr_level)
select id, 'de', 'learning', 'A1' from public.profiles where id::text like 'b1000000-%';
update public.profiles set onboarding_completed_at = now(), date_of_birth = '2000-01-01',
  country_code = 'DE', is_18_plus_confirmed = true, account_status = 'active',
  intentions = array['language_buddy']::public.intention_type[]
where id::text like 'b1000000-%';

-- As the owner: upload two photos ----------------------------------------------------
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000002', true);
set local role authenticated;

do $$
declare
  o constant uuid := 'b1000000-0000-0000-0000-000000000002';
begin
  insert into public.profile_photos (user_id, storage_path, position)
  values (o, o || '/one.webp', 0), (o, o || '/two.webp', 1);

  perform pg_temp.check(
    (select bool_and(moderation_status = 'pending') from public.profile_photos where user_id = o),
    'new uploads are pending');
  perform pg_temp.check(
    (select primary_photo_path is null from public.profiles where id = o),
    'no approved photo -> primary_photo_path is null');

  -- Users cannot approve their own photos, on insert or on update.
  perform pg_temp.raises(
    format($q$insert into public.profile_photos (user_id, storage_path, position, moderation_status) values (%L, 'x.webp', 2, 'approved')$q$, o),
    '42501', 'insert with moderation_status is denied');
  perform pg_temp.raises(
    format($q$update public.profile_photos set moderation_status = 'approved' where user_id = %L$q$, o),
    '42501', 'update of moderation_status is denied');
  perform pg_temp.raises(
    format($q$update public.profile_photos set moderation_source = 'manual' where user_id = %L$q$, o),
    '42501', 'update of moderation_source is denied');
  perform pg_temp.raises($q$select public.approve_photo(gen_random_uuid())$q$, '42501', 'authenticated cannot call approve_photo');
  perform pg_temp.raises($q$select public.reject_photo(gen_random_uuid(), 'x')$q$, '42501', 'authenticated cannot call reject_photo');
  perform pg_temp.raises($q$select * from public.moderation_photo_queue$q$, '42501', 'authenticated cannot read the queue');

  raise warning '✓ photo moderation: client rules passed';
end;
$$;

-- As the viewer: the owner is invisible until a photo is approved ----------------------
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000001', true);
do $$
begin
  perform pg_temp.check(
    not exists (select 1 from jsonb_array_elements(public.discover_profiles(50)) c
                where c ->> 'id' = 'b1000000-0000-0000-0000-000000000002'),
    'discover hides a profile with no approved photo');
  perform pg_temp.check(
    jsonb_array_length(public.get_profile_card('b1000000-0000-0000-0000-000000000002') -> 'photos') = 0,
    'profile card lists no pending photos for other people');
end;
$$;

-- Moderator approves the second photo only -----------------------------------------------
reset role;
do $$
declare
  v_id uuid;
begin
  select id into v_id from public.profile_photos where storage_path like '%/two.webp';
  perform public.approve_photo(v_id);
  perform pg_temp.check(
    (select moderation_status = 'approved' and moderation_source = 'manual' and moderated_at is not null
     from public.profile_photos where id = v_id), 'approve_photo records status, source and time');
  perform pg_temp.check(
    (select primary_photo_path like '%/two.webp' from public.profiles where id = 'b1000000-0000-0000-0000-000000000002'),
    'primary_photo_path becomes the first APPROVED photo, not position 0');
  perform pg_temp.raises(format($q$select public.approve_photo(%L)$q$, v_id), 'P0002', 'approving twice fails');
end;
$$;

select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
declare
  card jsonb;
begin
  perform pg_temp.check(
    exists (select 1 from jsonb_array_elements(public.discover_profiles(50)) c
            where c ->> 'id' = 'b1000000-0000-0000-0000-000000000002'
              and c ->> 'primary_photo_path' like '%/two.webp'),
    'discover shows the owner once a photo is approved, with the approved photo');
  card := public.get_profile_card('b1000000-0000-0000-0000-000000000002');
  perform pg_temp.check(
    jsonb_array_length(card -> 'photos') = 1 and card #>> '{photos,0,storage_path}' like '%/two.webp',
    'the card shows only the approved photo to other people');
end;
$$;

-- The owner still sees both of their own, and the rejected one stays out -----------------
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000002', true);
do $$
begin
  perform pg_temp.check(
    jsonb_array_length(public.get_profile_card('b1000000-0000-0000-0000-000000000002') -> 'photos') = 2,
    'the owner sees all their own photos');
  perform pg_temp.check(
    (select count(*) from public.profile_photos where user_id = auth.uid()) = 2,
    'the owner reads their own rows with status');
end;
$$;

reset role;
do $$
declare
  v_path text;
  v_id uuid;
begin
  select id into v_id from public.profile_photos where storage_path like '%/one.webp';
  v_path := public.reject_photo(v_id, 'Nudity or sexual content');
  perform pg_temp.check(v_path like '%/one.webp', 'reject_photo returns the path to delete');
  perform pg_temp.check(
    (select moderation_status = 'rejected' and moderation_reason = 'Nudity or sexual content'
     from public.profile_photos where id = v_id), 'rejection stores the reason');
  perform pg_temp.raises(format($q$select public.reject_photo(%L, '')$q$, v_id), '23514', 'a reason is required');

  -- Rejecting the approved photo leaves no approved photo: primary goes null.
  perform public.reject_photo((select id from public.profile_photos where storage_path like '%/two.webp'), 'Not a clear photo of you');
  perform pg_temp.check(
    (select primary_photo_path is null from public.profiles where id = 'b1000000-0000-0000-0000-000000000002'),
    'primary_photo_path is null again when nothing is approved');

  -- Replacing the file puts the row back in review.
  update public.profile_photos set moderation_status = 'approved', moderation_reason = null
  where storage_path like '%/two.webp';
  update public.profile_photos set storage_path = 'b1000000-0000-0000-0000-000000000002/three.webp'
  where storage_path like '%/two.webp';
  perform pg_temp.check(
    (select moderation_status = 'pending' and moderated_at is null and moderation_source is null
     from public.profile_photos where storage_path like '%/three.webp'),
    'swapping the file resets moderation to pending');
  perform pg_temp.check(
    (select count(*) from public.moderation_photo_queue where storage_path like '%/three.webp') = 1,
    'a pending photo appears in the queue view');

  raise warning '✓ photo moderation: reviewer path passed';
end;
$$;

rollback;
