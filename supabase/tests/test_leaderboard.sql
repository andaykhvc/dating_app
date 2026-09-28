-- Run against the scratch database only; fixtures are rolled back afterwards.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

-- Keep results independent of fixtures left by other suites.
update public.profiles set account_status = 'suspended';
insert into auth.users (id, raw_user_meta_data)
select ('a0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  jsonb_build_object('first_name', 'Learner ' || i)
from generate_series(1, 60) i;
insert into public.user_languages (user_id, language_code, role, cefr_level)
select id, 'en', 'native', null from public.profiles where id::text like 'a0000000-%';
insert into public.user_languages (user_id, language_code, role, cefr_level)
select id, 'de', 'learning', 'A1' from public.profiles where id::text like 'a0000000-%';
update public.profiles set onboarding_completed_at = now(), date_of_birth = '2000-01-01',
  country_code = 'DE', is_18_plus_confirmed = true, intentions = array['language_buddy']::public.intention_type[]
where id::text like 'a0000000-%';
update public.user_progress set total_xp = 1000, level = 11
where user_id::text like 'a0000000-%';
update public.user_progress set total_xp = 0, level = 1
where user_id = 'a0000000-0000-0000-0000-000000000060';
update public.profiles set account_status = 'suspended' where id = 'a0000000-0000-0000-0000-000000000001';
update public.profiles set account_status = 'deleted' where id = 'a0000000-0000-0000-0000-000000000002';
update public.profiles set onboarding_completed_at = null where id = 'a0000000-0000-0000-0000-000000000003';
insert into public.blocks (blocker_id, blocked_id) values
  ('a0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000004'),
  ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000060');

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000060', true);
set local role authenticated;
do $$
declare result jsonb := public.get_xp_leaderboard();
begin
  perform pg_temp.check(jsonb_array_length(result->'entries') = 50, 'bounded top 50');
  perform pg_temp.check((result->'current_user'->>'rank')::int = 55, 'own rank outside top 50; excluded accounts do not affect ranks');
  perform pg_temp.check((result->'current_user'->>'total_xp')::int = 0, 'zero XP included');
  perform pg_temp.check(result->'entries'->0->>'id' = 'a0000000-0000-0000-0000-000000000006', 'stable UUID tie order');
  perform pg_temp.check(not exists (
    select 1 from jsonb_array_elements(result->'entries') e
    where (e->>'rank')::int <> 1 or (e->>'total_xp')::int <> 1000
  ), 'descending XP and shared tie ranks');
  perform pg_temp.check(not exists (
    select 1 from jsonb_array_elements(result->'entries') e
    where e ? 'date_of_birth' or e ? 'email' or e ? 'bio' or e ? 'preferred_age_min'
  ), 'only shaped public fields');
  perform pg_temp.check(public.get_profile_card('a0000000-0000-0000-0000-000000000004') is null, 'outgoing block prevents profile read');
  perform pg_temp.check(public.get_profile_card('a0000000-0000-0000-0000-000000000005') is null, 'incoming block prevents profile read');
  perform pg_temp.check(public.get_profile_card('a0000000-0000-0000-0000-000000000006')->>'first_name' = 'Learner 6', 'ranked profile can be inspected without a match');
  perform pg_temp.check((select count(*) from public.profiles) = 1, 'profiles RLS remains own-row-only');
  perform pg_temp.check((select count(*) from public.user_progress) = 1, 'progress RLS remains own-row-only');
  perform pg_temp.check(not exists (select 1 from public.matches), 'read functions create no matches');
end;
$$;

-- Missing JWT, anonymous role, incomplete and suspended callers are rejected.
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  begin
    perform public.get_xp_leaderboard();
    raise exception 'FAILED: missing JWT accepted';
  exception when sqlstate '28000' then null; end;
end $$;
reset role;
select pg_temp.check(not has_function_privilege('anon', 'public.get_xp_leaderboard()', 'execute'), 'anon has no RPC execute grant');
select pg_temp.check(not has_function_privilege('anon', 'private.get_xp_leaderboard()', 'execute'), 'anon has no private execute grant');
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', true);
set local role authenticated;
do $$ begin
  begin
    perform public.get_xp_leaderboard();
    raise exception 'FAILED: incomplete caller accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  begin
    perform public.get_xp_leaderboard();
    raise exception 'FAILED: suspended caller accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- A newly awarded XP total must immediately move the learner above the ties.
update public.user_progress set total_xp = 1200, level = 13
where user_id = 'a0000000-0000-0000-0000-000000000060';
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000060', true);
set local role authenticated;
do $$
declare result jsonb := public.get_xp_leaderboard();
begin
  perform pg_temp.check(result->'entries'->0->>'id' = 'a0000000-0000-0000-0000-000000000060', 'new XP updates descending order');
  perform pg_temp.check((result->'current_user'->>'rank')::int = 1, 'own rank updates without a cache');
  perform pg_temp.check((result->'entries'->1->>'rank')::int = 2, 'remaining ties move down together');
end $$;
reset role;
rollback;
