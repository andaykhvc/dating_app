-- Streak rules: a streak day is a calendar day *in the user's timezone* on which
-- they were active. Run against the scratch database only; rolled back afterwards.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

insert into auth.users (id, raw_user_meta_data) values
  ('b0000000-0000-0000-0000-000000000001', '{"first_name":"Utc"}'),
  ('b0000000-0000-0000-0000-000000000002', '{"first_name":"Istanbul"}'),
  ('b0000000-0000-0000-0000-000000000003', '{"first_name":"Lapsed"}');
update public.profiles set timezone = 'Europe/Istanbul'
where id = 'b0000000-0000-0000-0000-000000000002';

create function pg_temp.streak(p_user uuid) returns smallint language sql as $$
  select current_streak_days from public.user_progress where user_id = p_user
$$;

do $$
declare
  u uuid := 'b0000000-0000-0000-0000-000000000001';
  i uuid := 'b0000000-0000-0000-0000-000000000002';
  l uuid := 'b0000000-0000-0000-0000-000000000003';
  d int;
begin
  -- Plain UTC user -------------------------------------------------------
  perform public.apply_streak_activity(u, timestamptz '2026-03-01 10:00+00');
  perform pg_temp.check(pg_temp.streak(u) = 1, 'day 1 -> 1');

  perform public.apply_streak_activity(u, timestamptz '2026-03-01 20:00+00');
  perform pg_temp.check(pg_temp.streak(u) = 1, 'same day twice leaves the streak unchanged');

  perform public.apply_streak_activity(u, timestamptz '2026-03-02 09:00+00');
  perform pg_temp.check(pg_temp.streak(u) = 2, 'next day -> 2');

  for d in 3..5 loop
    perform public.apply_streak_activity(u, timestamptz '2026-03-01 12:00+00' + make_interval(days => d - 1));
  end loop;
  perform pg_temp.check(pg_temp.streak(u) = 5, '5 consecutive days -> 5');
  perform pg_temp.check(
    (select longest_streak_days from public.user_progress where user_id = u) = 5,
    'longest_streak_days = 5');

  perform public.apply_streak_activity(u, timestamptz '2026-03-07 12:00+00');
  perform pg_temp.check(pg_temp.streak(u) = 1, 'skipping a day resets to 1');
  perform pg_temp.check(
    (select longest_streak_days from public.user_progress where user_id = u) = 5,
    'a reset keeps the longest streak');

  -- Timezone: Istanbul is UTC+3 ----------------------------------------------
  -- 22:30 UTC on the 10th is 01:30 on the 11th locally.
  perform public.apply_streak_activity(i, timestamptz '2026-03-10 22:30+00');
  perform pg_temp.check(pg_temp.streak(i) = 1, 'istanbul: first activity -> 1');
  -- 10:00 UTC on the 11th is 13:00 on the 11th locally: same local day, even
  -- though the UTC dates (10th and 11th) look consecutive.
  perform public.apply_streak_activity(i, timestamptz '2026-03-11 10:00+00');
  perform pg_temp.check(pg_temp.streak(i) = 1, 'istanbul: same local day does not count twice');
  -- 21:30 UTC on the 12th is 00:30 on the 13th locally: the 12th was skipped,
  -- even though the UTC dates (11th and 12th) look consecutive.
  perform public.apply_streak_activity(i, timestamptz '2026-03-12 21:30+00');
  perform pg_temp.check(pg_temp.streak(i) = 1, 'istanbul: a skipped local day resets');
  -- 02:00 UTC on the 14th is 05:00 on the 14th locally: consecutive.
  perform public.apply_streak_activity(i, timestamptz '2026-03-14 02:00+00');
  perform pg_temp.check(pg_temp.streak(i) = 2, 'istanbul: consecutive local days -> 2');

  -- Reading: a lapsed streak shows 0 -------------------------------------------
  update public.user_progress
  set current_streak_days = 4, longest_streak_days = 4, last_activity_date = date '2026-03-05'
  where user_id = l;
  perform pg_temp.check(
    public.effective_streak_days(l, timestamptz '2026-03-05 12:00+00') = 4, 'same day keeps the streak');
  perform pg_temp.check(
    public.effective_streak_days(l, timestamptz '2026-03-06 23:00+00') = 4, 'yesterday still counts');
  perform pg_temp.check(
    public.effective_streak_days(l, timestamptz '2026-03-07 00:30+00') = 0, '2+ days ago reads as 0');

  -- grant_xp goes through the same path, and zero XP still counts as practice.
  update public.user_progress
  set current_streak_days = 0, last_activity_date = null where user_id = l;
  perform public.grant_xp(l, 0::smallint, 'lesson_completed');
  perform pg_temp.check(pg_temp.streak(l) = 1, 'a zero-XP session still keeps the streak alive');
  perform pg_temp.check(
    (select total_xp from public.user_progress where user_id = l) = 0, 'zero-XP session adds no XP');
  perform pg_temp.check(
    not exists (select 1 from public.xp_events where user_id = l), 'zero-XP session writes no ledger row');

  -- Timezone validation --------------------------------------------------------
  perform pg_temp.check(public.normalize_timezone('Europe/Berlin') = 'Europe/Berlin', 'valid zone kept');
  perform pg_temp.check(public.normalize_timezone('Mars/Olympus') = 'UTC', 'unknown zone -> UTC');
  perform pg_temp.check(public.normalize_timezone(null) = 'UTC', 'null -> UTC');

  raise warning '✓ streak checks passed';
end;
$$;

-- Clients may read and set their zone but never advance streaks themselves.
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
begin
  perform public.set_my_timezone('America/New_York');
  perform pg_temp.check(
    (select timezone from public.profiles where id = 'b0000000-0000-0000-0000-000000000001') = 'America/New_York',
    'set_my_timezone stores a valid zone');
  perform public.set_my_timezone('Not/AZone');
  perform pg_temp.check(
    (select timezone from public.profiles where id = 'b0000000-0000-0000-0000-000000000001') = 'UTC',
    'set_my_timezone falls back to UTC');
  begin
    perform public.apply_streak_activity('b0000000-0000-0000-0000-000000000001', now());
    raise exception 'FAILED: authenticated could call apply_streak_activity';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.grant_xp('b0000000-0000-0000-0000-000000000001', 5::smallint, 'lesson_completed');
    raise exception 'FAILED: authenticated could call grant_xp';
  exception when insufficient_privilege then null;
  end;
  raise warning '✓ streak permissions passed';
end;
$$;

rollback;
