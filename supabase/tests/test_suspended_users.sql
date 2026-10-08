-- Run against the scratch database only; fixtures are rolled back afterwards.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

-- Three complete, active people: A (will be suspended), B (matched with A), C.
insert into auth.users (id, raw_user_meta_data)
select ('f0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
       jsonb_build_object('first_name', 'Person' || i)
from generate_series(1, 3) i;
insert into public.user_languages (user_id, language_code, role, cefr_level)
select id, 'en', 'native', null from public.profiles where id::text like 'f0000000-%';
insert into public.user_languages (user_id, language_code, role, cefr_level)
select id, 'de', 'learning', 'A1' from public.profiles where id::text like 'f0000000-%';
update public.profiles set onboarding_completed_at = now(), date_of_birth = '1995-01-01',
  country_code = 'DE', is_18_plus_confirmed = true,
  intentions = array['language_buddy']::public.intention_type[]
where id::text like 'f0000000-%';

insert into public.matches (user_a, user_b) values
  ('f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002');
insert into public.matches (user_a, user_b) values
  ('f0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003');

create function pg_temp.as_user(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_uid::text, false);
  execute 'set role authenticated';
end $$;

-- Before: A and B can talk.
select pg_temp.as_user('f0000000-0000-0000-0000-000000000001');
insert into public.messages (match_id, sender_id, body)
select id, 'f0000000-0000-0000-0000-000000000001', 'hello before'
from public.matches where user_a = 'f0000000-0000-0000-0000-000000000001';
reset role;

-- The owner handles a report: report -> queue -> read context -> suspend.
insert into public.reports (reporter_id, reported_id, match_id, reason, details)
select 'f0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', id, 'harassment', 'rude'
from public.matches where user_a = 'f0000000-0000-0000-0000-000000000001';
insert into public.reports (reporter_id, reported_id, reason)
values ('f0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'underage');

select pg_temp.check((select count(*) from public.moderation_open_reports) = 2, 'both reports are in the queue');
select pg_temp.check((select reason from public.moderation_open_reports limit 1) = 'underage',
  'an underage report is listed first');
select pg_temp.check((select max(times_reported) from public.moderation_open_reports) = 2,
  'repeat reports are counted');
select pg_temp.check(
  (select count(*) from public.moderation_messages(
     (select id from public.matches where user_a = 'f0000000-0000-0000-0000-000000000001'))) = 1,
  'the conversation can be read for context');

select public.moderation_suspend('f0000000-0000-0000-0000-000000000001',
  (select report_id from public.moderation_open_reports where reason = 'harassment'));
select pg_temp.check(
  (select status from public.reports where reason = 'harassment') = 'reviewed', 'the report is marked handled');

-- Suspended A: ...cannot swipe.
select pg_temp.as_user('f0000000-0000-0000-0000-000000000001');
do $$
begin
  perform public.record_swipe('f0000000-0000-0000-0000-000000000003', 'like');
  raise exception 'FAILED: a suspended user could swipe';
exception when insufficient_privilege then null; end $$;

-- ...cannot send a message in the chat that was open.
do $$
begin
  insert into public.messages (match_id, sender_id, body)
  select id, 'f0000000-0000-0000-0000-000000000001', 'still talking'
  from public.matches where user_a = 'f0000000-0000-0000-0000-000000000001';
  raise exception 'FAILED: a suspended user could send a message';
exception when insufficient_privilege then null; end $$;
reset role;

select pg_temp.check(
  (select status from public.matches where user_a = 'f0000000-0000-0000-0000-000000000001') = 'unmatched',
  'the suspended person''s conversation ended');
select pg_temp.check(
  (select status from public.matches where user_b = 'f0000000-0000-0000-0000-000000000003') = 'active',
  'other people''s conversations are untouched');

-- B (the other side) cannot post into the ended chat; B can still talk to C.
select pg_temp.as_user('f0000000-0000-0000-0000-000000000002');
do $$
begin
  insert into public.messages (match_id, sender_id, body)
  select id, 'f0000000-0000-0000-0000-000000000002', 'hello?'
  from public.matches where user_a = 'f0000000-0000-0000-0000-000000000001';
  raise exception 'FAILED: a message was accepted into a chat with a suspended person';
exception when insufficient_privilege then null; end $$;
insert into public.messages (match_id, sender_id, body)
select id, 'f0000000-0000-0000-0000-000000000002', 'hi C'
from public.matches where user_b = 'f0000000-0000-0000-0000-000000000003';

-- B no longer sees A in Discover; the history stays readable.
select pg_temp.check(
  not exists (select 1 from jsonb_array_elements(public.discover_profiles(30)) e
              where e ->> 'id' = 'f0000000-0000-0000-0000-000000000001'),
  'a suspended person is not shown in Discover');
select pg_temp.check(
  (select count(*) from public.messages where body = 'hello before') = 1,
  'the earlier conversation is still readable');
reset role;

-- Reinstating restores swiping but not the old chat.
select public.moderation_reinstate('f0000000-0000-0000-0000-000000000001');
select pg_temp.check(
  (select account_status from public.profiles where id = 'f0000000-0000-0000-0000-000000000001') = 'active',
  'reinstated');
select pg_temp.check(
  (select status from public.matches where user_a = 'f0000000-0000-0000-0000-000000000001') = 'unmatched',
  'the old conversation stays ended');

-- Dismissing a report.
select public.moderation_resolve_report((select report_id from public.moderation_open_reports limit 1), 'dismissed');
select pg_temp.check((select count(*) from public.moderation_open_reports) = 0, 'the queue is empty again');

-- Nothing here is reachable by the app.
select pg_temp.check(
  not has_function_privilege('authenticated', 'public.moderation_suspend(uuid, uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.moderation_reinstate(uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.moderation_resolve_report(uuid, text)', 'execute')
  and not has_function_privilege('authenticated', 'public.moderation_messages(uuid, int)', 'execute')
  and not has_function_privilege('authenticated', 'public.is_active_user(uuid)', 'execute')
  and not has_table_privilege('authenticated', 'public.moderation_open_reports', 'select')
  and not has_function_privilege('anon', 'public.moderation_suspend(uuid, uuid)', 'execute'),
  'moderation tools are not reachable by clients');

rollback;
\echo 'suspended user checks passed'
