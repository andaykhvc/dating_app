-- Deleting a user (the same statement the Admin API runs: delete from
-- auth.users) removes their personal data, keeps the other person's data
-- intact, and keeps an anonymous safety record of reports against them.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

-- A is deleted; B stays; C is reported by A and reports A.
insert into auth.users (id, raw_user_meta_data) values
  ('e0000000-0000-0000-0000-00000000000a', '{"first_name":"Alice"}'),
  ('e0000000-0000-0000-0000-00000000000b', '{"first_name":"Bruno"}'),
  ('e0000000-0000-0000-0000-00000000000c', '{"first_name":"Carla"}');
update public.profiles set bio = 'about me' where id::text like 'e0000000-%';
insert into public.user_languages (user_id, language_code, role, cefr_level) values
  ('e0000000-0000-0000-0000-00000000000b', 'en', 'native', null),
  ('e0000000-0000-0000-0000-00000000000b', 'de', 'learning', 'A1');
update public.profiles set onboarding_completed_at = now(), date_of_birth = '2000-01-01',
  country_code = 'DE', is_18_plus_confirmed = true, intentions = array['language_buddy']::public.intention_type[]
where id = 'e0000000-0000-0000-0000-00000000000b';

insert into public.matches (id, user_a, user_b) values
  ('f0000000-0000-0000-0000-0000000000ab', 'e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000b'),
  ('f0000000-0000-0000-0000-0000000000bc', 'e0000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-00000000000c');
insert into public.messages (match_id, sender_id, body) values
  ('f0000000-0000-0000-0000-0000000000ab', 'e0000000-0000-0000-0000-00000000000a', 'hello from A'),
  ('f0000000-0000-0000-0000-0000000000ab', 'e0000000-0000-0000-0000-00000000000b', 'hello from B'),
  ('f0000000-0000-0000-0000-0000000000bc', 'e0000000-0000-0000-0000-00000000000b', 'B and C chat');
insert into public.swipes (swiper_id, swipee_id, action) values
  ('e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000b', 'like'),
  ('e0000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-00000000000a', 'like'),
  ('e0000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-00000000000c', 'like');
insert into public.blocks (blocker_id, blocked_id) values
  ('e0000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-00000000000a');
insert into public.profile_photos (user_id, storage_path, position) values
  ('e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000a/p.webp', 0),
  ('e0000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-00000000000b/p.webp', 0);
select public.grant_xp('e0000000-0000-0000-0000-00000000000a', 10::smallint, 'lesson_completed');
select public.grant_xp('e0000000-0000-0000-0000-00000000000b', 10::smallint, 'lesson_completed');
insert into public.reports (id, reporter_id, reported_id, match_id, reason, details) values
  ('a1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-00000000000a', 'f0000000-0000-0000-0000-0000000000ab', 'spam', 'A sent me links'),
  ('a1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000c', null, 'harassment', 'C was rude'),
  ('a1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-00000000000c', null, 'other', 'B about C');

delete from auth.users where id = 'e0000000-0000-0000-0000-00000000000a';

do $$
declare
  a constant uuid := 'e0000000-0000-0000-0000-00000000000a';
  b constant uuid := 'e0000000-0000-0000-0000-00000000000b';
begin
  perform pg_temp.check(not exists (select 1 from public.profiles where id = a), 'A profile gone');
  perform pg_temp.check(not exists (select 1 from public.profile_photos where user_id = a), 'A photo rows gone');
  perform pg_temp.check(not exists (select 1 from public.user_progress where user_id = a), 'A progress gone');
  perform pg_temp.check(not exists (select 1 from public.xp_events where user_id = a), 'A xp events gone');
  perform pg_temp.check(not exists (select 1 from public.swipes where a in (swiper_id, swipee_id)), 'swipes both ways gone');
  perform pg_temp.check(not exists (select 1 from public.blocks where a in (blocker_id, blocked_id)), 'blocks both ways gone');
  perform pg_temp.check(not exists (select 1 from public.matches where a in (user_a, user_b)), 'A matches gone');
  perform pg_temp.check(
    not exists (select 1 from public.messages where body like '%from A%' or body like '%from B%'),
    'the whole A-B thread is gone, including B''s messages in it');
  perform pg_temp.check(not exists (select 1 from public.user_languages where user_id = a), 'A languages gone');

  -- B and the B-C world are untouched.
  perform pg_temp.check(exists (select 1 from public.profiles where id = b and bio = 'about me'), 'B profile intact');
  perform pg_temp.check(exists (select 1 from public.profile_photos where user_id = b), 'B photo intact');
  perform pg_temp.check((select count(*) from public.xp_events where user_id = b) = 1, 'B xp intact');
  perform pg_temp.check(
    (select count(*) from public.messages where match_id = 'f0000000-0000-0000-0000-0000000000bc') = 1,
    'B-C chat intact');
  perform pg_temp.check(
    (select count(*) from public.swipes where swiper_id = b) = 1, 'B''s remaining swipe intact');

  -- Reports: kept, detached from A.
  perform pg_temp.check(
    exists (select 1 from public.reports where id = 'a1000000-0000-0000-0000-000000000001'
      and reported_id is null and reporter_id = b and details is null and reason = 'spam'),
    'report against A kept anonymously, free text scrubbed');
  perform pg_temp.check(
    exists (select 1 from public.reports where id = 'a1000000-0000-0000-0000-000000000002'
      and reporter_id is null and reported_id = 'e0000000-0000-0000-0000-00000000000c' and details = 'C was rude'),
    'report filed by A kept for C''s safety, reporter detached');
  perform pg_temp.check(
    exists (select 1 from public.reports where id = 'a1000000-0000-0000-0000-000000000003' and details = 'B about C'),
    'unrelated report untouched');

  raise warning '✓ account deletion checks passed';
end;
$$;

-- Other people's screens keep working.
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-00000000000b', true);
set local role authenticated;
do $$
declare
  matches jsonb;
begin
  perform pg_temp.check(public.get_xp_leaderboard() is not null, 'leaderboard still runs');
  matches := to_jsonb(array(select m from public.get_matches() m));
  perform pg_temp.check(jsonb_array_length(matches) = 1, 'B''s match list has only the B-C match');
  raise warning '✓ other users'' screens checks passed';
end;
$$;

rollback;
