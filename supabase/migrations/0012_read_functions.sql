-- 0012_read_functions.sql
-- Shaped reads of other people's data.
--
-- Since profiles is own-row-only under RLS, these are the only way to see
-- anyone else, and they name every column they return. Date of birth is turned
-- into an age here and never crosses the wire; neither do discovery
-- preferences, block lists, or anything else the viewer has no business seeing.
-- They also collapse what would otherwise be N+1 queries into one round trip,
-- which matters more than usual on a free database tier.

create or replace function public.profile_age(p_dob date)
returns int
language sql
immutable
as $$
  select case when p_dob is null then null
    else extract(year from age(current_date, p_dob))::int end;
$$;

-- ---------------------------------------------------------------------------
-- Discovery feed
-- ---------------------------------------------------------------------------
--
-- No OFFSET: every swipe is recorded before the next card is needed, so the
-- swiped-out rows fall out of the result set on their own. Paging by offset on
-- a shrinking set would silently skip people.
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

grant execute on function public.discover_profiles(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Match list: partner, latest message and current mission in a single query.
-- ---------------------------------------------------------------------------
create or replace function public.get_matches()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select coalesce(jsonb_agg(x.row order by x.sort_at desc), '[]'::jsonb)
  into v_result
  from (
    select
      coalesce(lm.created_at, m.matched_at) as sort_at,
      jsonb_build_object(
        'match_id', m.id,
        'status', m.status,
        'matched_at', m.matched_at,
        'partner', jsonb_build_object(
          'id', partner.id,
          'first_name', partner.first_name,
          'age', public.profile_age(partner.date_of_birth),
          'country_code', partner.country_code,
          'city', partner.city,
          'primary_photo_path', partner.primary_photo_path,
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
            where ul.user_id = partner.id
          ), '[]'::jsonb)
        ),
        'last_message', case when lm.id is null then null else jsonb_build_object(
          'id', lm.id,
          'body', lm.body,
          'created_at', lm.created_at,
          'is_mine', lm.sender_id = v_uid
        ) end,
        'mission', case when mm.id is null then null else jsonb_build_object(
          'match_mission_id', mm.id,
          'title', mi.title,
          'description', mi.description,
          'steps_completed', mm.steps_completed,
          'target_steps', mi.target_steps,
          'xp_reward_per_step', mi.xp_reward_per_step,
          'game_template_id', mi.related_game_template_id
        ) end
      ) as row
    from matches m
    join profiles partner
      on partner.id = case when m.user_a = v_uid then m.user_b else m.user_a end
    left join lateral (
      select id, body, created_at, sender_id
      from messages
      where match_id = m.id
      order by id desc
      limit 1
    ) lm on true
    left join match_missions mm on mm.match_id = m.id and mm.status = 'active'
    left join missions mi on mi.id = mm.mission_id
    -- Unmatched conversations are included so their history stays readable;
    -- the list screens filter to active ones.
    where v_uid in (m.user_a, m.user_b)
  ) x;

  return v_result;
end;
$$;

grant execute on function public.get_matches() to authenticated;

-- ---------------------------------------------------------------------------
-- Full profile card, used by the discovery detail sheet and the chat header.
-- Visible only for someone you could swipe on or have already matched with.
-- ---------------------------------------------------------------------------
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
      from profile_photos ph where ph.user_id = v_p.id
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

grant execute on function public.get_profile_card(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Play hub: progress, today's solo challenge, and every mission in flight.
-- ---------------------------------------------------------------------------
create or replace function public.get_play_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_learning text;
  v_progress jsonb;
  v_daily jsonb;
  v_missions jsonb;
  v_practice jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select language_code into v_learning
  from user_languages where user_id = v_uid and role = 'learning' limit 1;

  select jsonb_build_object(
    'total_xp', total_xp,
    'level', level,
    'league', league,
    'current_streak_days', current_streak_days,
    'longest_streak_days', longest_streak_days,
    'last_activity_date', last_activity_date,
    'xp_into_level', total_xp % 100,
    'xp_for_next_level', 100
  )
  into v_progress
  from user_progress where user_id = v_uid;

  -- Same challenge all day, different per person: hashing the user and the date
  -- gives that for free, with no table to store or job to run.
  select jsonb_build_object(
    'game_template_id', t.id,
    'key', t.key,
    'type', t.type,
    'title', t.title,
    'description', t.description,
    'xp_reward', t.default_xp_reward,
    'completed_today', exists (
      select 1 from game_sessions gs
      where gs.initiator_id = v_uid
        and gs.game_template_id = t.id
        and gs.status = 'completed'
        and gs.completed_at >= date_trunc('day', now() at time zone 'utc')
    )
  )
  into v_daily
  from game_templates t
  where t.is_active and t.is_solo
    and exists (
      select 1 from game_content gc
      where gc.game_template_id = t.id
        and gc.language_code = v_learning
        and gc.is_active
    )
  order by md5(v_uid::text || (now() at time zone 'utc')::date::text || t.id::text)
  limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'match_mission_id', mm.id,
    'match_id', m.id,
    'partner_first_name', partner.first_name,
    'partner_photo_path', partner.primary_photo_path,
    'title', mi.title,
    'description', mi.description,
    'steps_completed', mm.steps_completed,
    'target_steps', mi.target_steps,
    'xp_reward_per_step', mi.xp_reward_per_step,
    'game_template_id', mi.related_game_template_id
  ) order by mm.assigned_at desc), '[]'::jsonb)
  into v_missions
  from match_missions mm
  join matches m on m.id = mm.match_id
  join missions mi on mi.id = mm.mission_id
  join profiles partner
    on partner.id = case when m.user_a = v_uid then m.user_b else m.user_a end
  where mm.status = 'active'
    and m.status = 'active'
    and v_uid in (m.user_a, m.user_b);

  select coalesce(jsonb_agg(jsonb_build_object(
    'game_template_id', t.id,
    'key', t.key,
    'type', t.type,
    'title', t.title,
    'description', t.description,
    'xp_reward', t.default_xp_reward
  ) order by t.id), '[]'::jsonb)
  into v_practice
  from game_templates t
  where t.is_active and t.is_solo
    and exists (
      select 1 from game_content gc
      where gc.game_template_id = t.id
        and gc.language_code = v_learning
        and gc.is_active
    );

  return jsonb_build_object(
    'progress', v_progress,
    'daily_challenge', v_daily,
    'match_missions', v_missions,
    'practice', v_practice,
    'learning_language', v_learning
  );
end;
$$;

grant execute on function public.get_play_overview() to authenticated;

-- Reopening a challenge by id. Same answer-stripping as start_game_session,
-- so a refresh or a deep link cannot be used to read the answer key.
create or replace function public.get_game_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_session record;
  v_template record;
  v_content record;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_session from game_sessions where id = p_session_id;
  if v_session is null or v_session.initiator_id <> v_uid then
    return null;
  end if;

  select * into v_template from game_templates where id = v_session.game_template_id;
  select * into v_content from game_content where id = v_session.game_content_id;

  return jsonb_build_object(
    'session_id', v_session.id,
    'status', v_session.status,
    'match_id', v_session.match_id,
    'template', jsonb_build_object(
      'id', v_template.id,
      'key', v_template.key,
      'type', v_template.type,
      'title', v_template.title,
      'description', v_template.description,
      'instructions', v_template.instructions,
      'is_gradable', v_template.is_gradable,
      'xp_reward', v_template.default_xp_reward
    ),
    'content', case
      when v_content.id is null then null
      else jsonb_build_object(
        'id', v_content.id,
        'language_code', v_content.language_code,
        'cefr_level', v_content.cefr_level,
        'payload', public.strip_answer(v_template.type, v_content.payload)
      )
    end
  );
end;
$$;

grant execute on function public.get_game_session(uuid) to authenticated;

-- Names for the blocked list in settings, which RLS otherwise hides.
create or replace function public.get_blocked_users()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id', p.id,
      'first_name', p.first_name,
      'primary_photo_path', p.primary_photo_path,
      'blocked_at', b.created_at
    ) order by b.created_at desc)
    from blocks b
    join profiles p on p.id = b.blocked_id
    where b.blocker_id = v_uid
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.get_blocked_users() to authenticated;
