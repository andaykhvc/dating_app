-- "Download my data" (issue #43): the export reads with the caller's own
-- session, so RLS must keep other people's rows out, and the two helper
-- functions must only ever return the caller's rows. Rolled back afterwards.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

-- A and B are matched; B and C are matched; D is a stranger.
insert into auth.users (id, raw_user_meta_data) values
  ('c0000000-0000-0000-0000-00000000000a', '{"first_name":"Alice"}'),
  ('c0000000-0000-0000-0000-00000000000b', '{"first_name":"Bruno"}'),
  ('c0000000-0000-0000-0000-00000000000c', '{"first_name":"Carla"}'),
  ('c0000000-0000-0000-0000-00000000000d', '{"first_name":"Dora"}');

insert into public.matches (id, user_a, user_b) values
  ('d0000000-0000-0000-0000-0000000000ab', 'c0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000b'),
  ('d0000000-0000-0000-0000-0000000000bc', 'c0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000c');
insert into public.messages (match_id, sender_id, body) values
  ('d0000000-0000-0000-0000-0000000000ab', 'c0000000-0000-0000-0000-00000000000a', 'from A to B'),
  ('d0000000-0000-0000-0000-0000000000ab', 'c0000000-0000-0000-0000-00000000000b', 'from B to A'),
  ('d0000000-0000-0000-0000-0000000000bc', 'c0000000-0000-0000-0000-00000000000b', 'B to C secret'),
  ('d0000000-0000-0000-0000-0000000000bc', 'c0000000-0000-0000-0000-00000000000c', 'C to B secret');
insert into public.swipes (swiper_id, swipee_id, action) values
  ('c0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000b', 'like'),
  ('c0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000a', 'like'),
  ('c0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000c', 'like');
insert into public.blocks (blocker_id, blocked_id) values
  ('c0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000d');
insert into public.xp_events (user_id, amount, reason) values
  ('c0000000-0000-0000-0000-00000000000a', 10, 'lesson_completed'),
  ('c0000000-0000-0000-0000-00000000000b', 20, 'lesson_completed');
insert into public.lesson_sessions (user_id, mode, language_code, known_language_code, exercises, status, results) values
  ('c0000000-0000-0000-0000-00000000000a', 'review', 'de', 'en', '[{"answer":"SECRET-KEY"}]', 'completed', '{"0":{"correct":true}}'),
  ('c0000000-0000-0000-0000-00000000000b', 'review', 'de', 'en', '[{"answer":"SECRET-KEY"}]', 'completed', '{}');
insert into public.game_sessions (game_template_id, match_id, initiator_id, status)
select id, 'd0000000-0000-0000-0000-0000000000ab', 'c0000000-0000-0000-0000-00000000000b', 'completed'
from public.game_templates limit 1;

select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-00000000000a', true);
set local role authenticated;

do $$
declare
  extras jsonb;
begin
  -- Tables read with RLS, exactly as the route does ------------------------------
  perform pg_temp.check(
    (select count(*) from public.messages) = 2
      and not exists (select 1 from public.messages where body like '%secret%'),
    'messages: both directions of A''s own match, nothing from B and C');
  perform pg_temp.check(
    (select count(*) from public.swipes) = 1
      and not exists (select 1 from public.swipes where swiper_id <> auth.uid()),
    'swipes: only the ones A made');
  perform pg_temp.check(
    (select count(*) from public.matches) = 1, 'matches: only A''s match');
  perform pg_temp.check(
    (select count(*) from public.blocks) = 0, 'blocks: B''s block is not visible to A');
  perform pg_temp.check(
    (select count(*) from public.xp_events) = 1
      and not exists (select 1 from public.xp_events where user_id <> auth.uid()),
    'xp_events: own only');
  perform pg_temp.check(
    (select count(*) from public.profiles) = 1
      and (select id from public.profiles) = auth.uid(),
    'profiles: own row only');
  perform pg_temp.check(
    (select count(*) from public.user_progress) = 1, 'user_progress: own row only');
  perform pg_temp.check(
    not exists (select 1 from public.lesson_sessions), 'lesson_sessions has no direct client read');
  -- B started this game inside the shared match: RLS shows it, so the route
  -- filters on initiator_id, which must yield nothing for A.
  perform pg_temp.check(
    (select count(*) from public.game_sessions where initiator_id = auth.uid()) = 0,
    'game_sessions: partner-initiated sessions are filtered out by initiator_id');

  -- Helper function ----------------------------------------------------------------
  extras := public.get_my_export_extras();
  perform pg_temp.check(
    jsonb_array_length(extras -> 'match_partners') = 1
      and extras #>> '{match_partners,0,partner_first_name}' = 'Bruno',
    'match_partners: only the partner''s first name, only for A''s match');
  perform pg_temp.check(
    (select count(*) from jsonb_object_keys(extras #> '{match_partners,0}')) = 2,
    'match_partners: nothing but match_id and the first name');
  perform pg_temp.check(
    jsonb_array_length(extras -> 'lesson_sessions') = 1
      and extras::text not like '%SECRET-KEY%'
      and not (extras #> '{lesson_sessions,0}' ? 'exercises'),
    'lesson_sessions: own rows, no answer keys');

  -- Rate limit ---------------------------------------------------------------------------
  perform pg_temp.check(public.claim_data_export() = 0, 'first export is allowed');
  perform pg_temp.check(public.claim_data_export() between 1 and 60, 'second export within a minute is refused');
  perform pg_temp.check(public.claim_data_export(interval '0 seconds') = 0, 'a zero interval always allows');

  raise warning '✓ data export checks passed';
end;
$$;

-- The rate limit is per person.
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-00000000000b', true);
do $$
begin
  perform pg_temp.check(public.claim_data_export() = 0, 'B is not limited by A''s export');
  begin
    perform 1 from public.data_export_requests;
    raise exception 'FAILED: client could read data_export_requests';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- Signed-out callers get nothing.
reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
do $$
begin
  begin
    perform public.get_my_export_extras();
    raise exception 'FAILED: anon could call get_my_export_extras';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.claim_data_export();
    raise exception 'FAILED: anon could call claim_data_export';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
