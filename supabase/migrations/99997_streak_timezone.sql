-- 99997_streak_timezone.sql
-- Streak fixes (issue #26).
--
-- Root causes:
--  1. grant_xp compared last_activity_date with the *UTC* date. For a learner
--     in Turkey (UTC+3) a 01:00 session belongs to the previous UTC day, so two
--     sessions on the same local day could look like consecutive UTC days (and a
--     skipped local day could look consecutive), which stalled or reset the
--     streak.
--  2. current_streak_days is only recomputed when XP is next earned, so after a
--     missed day every screen kept showing the old number.
--  3. A lesson scored below 50 % grants 0 XP, and grant_xp returned before
--     touching the streak, so a day of practice did not count.
--
-- Existing users: nobody has a stored timezone yet, so everyone starts on UTC
-- (the old behaviour) until their browser reports its zone on the next app
-- load. Stored streak numbers and last_activity_date values are not rewritten.

alter table public.profiles
  add column timezone text not null default 'UTC';

-- Unknown, empty or malformed zones fall back to UTC instead of failing.
create or replace function public.normalize_timezone(p_timezone text)
returns text
language sql
stable
set search_path = public, pg_catalog
as $$
  select coalesce(
    (select n.name from pg_catalog.pg_timezone_names n where n.name = p_timezone limit 1),
    'UTC');
$$;

-- The user's calendar date at the instant p_at.
create or replace function public.user_local_date(p_user_id uuid, p_at timestamptz default now())
returns date
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select (p_at at time zone coalesce(
    (select public.normalize_timezone(p.timezone) from public.profiles p where p.id = p_user_id),
    'UTC'))::date;
$$;

-- Records that the user was active at p_at. Split out of grant_xp so the day
-- arithmetic can be tested with a chosen clock.
create or replace function public.apply_streak_activity(p_user_id uuid, p_at timestamptz default now())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.user_local_date(p_user_id, p_at);
  v_last_activity date;
  v_streak smallint;
begin
  select last_activity_date, current_streak_days
  into v_last_activity, v_streak
  from user_progress
  where user_id = p_user_id
  for update;

  if not found then
    return;
  end if;

  -- A streak day is any day the user was active. A stored date that is not
  -- before today (same day, or "tomorrow" because the user moved to a zone
  -- further west) leaves the streak as it is.
  if v_last_activity is not null and v_last_activity >= v_today then
    return;
  elsif v_last_activity = v_today - 1 then
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  update user_progress
  set current_streak_days = v_streak,
      longest_streak_days = greatest(longest_streak_days, v_streak),
      last_activity_date = v_today,
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

revoke execute on function public.apply_streak_activity(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.user_local_date(uuid, timestamptz) from public, anon, authenticated;

-- Streak as it should be shown right now: 0 once the user missed a whole day.
create or replace function public.effective_streak_days(p_user_id uuid, p_at timestamptz default now())
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when up.last_activity_date is null then 0
    when up.last_activity_date >= public.user_local_date(p_user_id, p_at) - 1 then up.current_streak_days
    else 0
  end::integer
  from user_progress up
  where up.user_id = p_user_id;
$$;

revoke execute on function public.effective_streak_days(uuid, timestamptz) from public, anon;
grant execute on function public.effective_streak_days(uuid, timestamptz) to authenticated;

-- The numbers every screen shows, computed the same way for all of them.
create or replace function public.get_my_streak()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'current_streak_days', public.effective_streak_days(auth.uid()),
    'longest_streak_days', coalesce(up.longest_streak_days, 0),
    'last_activity_date', up.last_activity_date)
  from (select 1) s
  left join user_progress up on up.user_id = auth.uid()
  where auth.uid() is not null;
$$;

revoke execute on function public.get_my_streak() from public, anon;
grant execute on function public.get_my_streak() to authenticated;

-- The browser reports its IANA zone once per session. Validated against
-- pg_timezone_names; anything unknown becomes UTC.
create or replace function public.set_my_timezone(p_timezone text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_zone text := public.normalize_timezone(p_timezone);
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  update profiles set timezone = v_zone where id = auth.uid() and timezone is distinct from v_zone;
  return v_zone;
end;
$$;

revoke execute on function public.set_my_timezone(text) from public, anon;
grant execute on function public.set_my_timezone(text) to authenticated;

-- grant_xp: same signature, same internal-only grants. XP and the ledger as
-- before; the streak now goes through apply_streak_activity, and a zero-XP
-- session counts as activity (it just adds no XP).
create or replace function public.grant_xp(
  p_user_id uuid,
  p_amount smallint,
  p_reason xp_reason,
  p_source_table text default null,
  p_source_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount is null or p_amount < 0 then
    return;
  end if;

  if p_amount > 0 then
    insert into xp_events (user_id, amount, reason, source_table, source_id)
    values (p_user_id, p_amount, p_reason, p_source_table, p_source_id);

    update user_progress
    set total_xp = total_xp + p_amount,
        level = greatest(1, (total_xp + p_amount) / 100 + 1),
        league = case
          when (total_xp + p_amount) / 100 + 1 >= 10 then 'gold'
          when (total_xp + p_amount) / 100 + 1 >= 5 then 'silver'
          else 'bronze'
        end,
        updated_at = now()
    where user_id = p_user_id;
  end if;

  perform public.apply_streak_activity(p_user_id, now());
end;
$$;

revoke execute on function public.grant_xp(uuid, smallint, xp_reason, text, text) from public, anon, authenticated;

-- get_play_overview: the streak the Play hub shows is the effective one.
-- (Same body as 0012; only current_streak_days changes. Grants are unchanged.)
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
    'current_streak_days', public.effective_streak_days(v_uid),
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

