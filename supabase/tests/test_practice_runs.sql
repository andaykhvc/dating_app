-- test_practice_runs.sql
-- Daily and Quick practice runs (issue #28), through the same RPCs the app calls,
-- as the `authenticated` role with auth.uid() set.
\set ON_ERROR_STOP 1
set client_min_messages = warning;

create function pg_temp.as_user(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_uid::text, false);
  execute 'set role authenticated';
end $$;

create function pg_temp.as_owner() returns void language plpgsql as $$
begin
  execute 'reset role';
end $$;

create function pg_temp.check(p_ok boolean, p_msg text) returns void language plpgsql as $$
begin
  if p_ok is not true then raise exception 'FAILED: %', p_msg; end if;
end $$;

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
end $$;

create function pg_temp.right_answer(p_ex jsonb) returns jsonb language sql as $$
  select case p_ex ->> 'type'
    when 'true_false' then jsonb_build_object('value', (p_ex -> 'answer' ->> 'value')::boolean)
    when 'match_pairs' then jsonb_build_object('pairs', p_ex -> 'answer' -> 'pairs')
    when 'type_translation' then jsonb_build_object('text', p_ex -> 'answer' -> 'accept' ->> 0)
    when 'listen_type' then jsonb_build_object('text', p_ex -> 'answer' -> 'accept' ->> 0)
    when 'word_order' then jsonb_build_object('tokens', to_jsonb(regexp_split_to_array(p_ex -> 'answer' -> 'accept' ->> 0, '\s+')))
    when 'word_bank' then jsonb_build_object('tokens', to_jsonb(regexp_split_to_array(p_ex -> 'answer' -> 'accept' ->> 0, '\s+')))
    else jsonb_build_object('choice', p_ex -> 'answer' ->> 'choice')
  end;
$$;

create function pg_temp.wrong_answer(p_ex jsonb) returns jsonb language sql as $$
  select case p_ex ->> 'type'
    when 'true_false' then jsonb_build_object('value', not (p_ex -> 'answer' ->> 'value')::boolean)
    when 'match_pairs' then '{"pairs": {}}'::jsonb
    when 'type_translation' then '{"text": "zzz"}'::jsonb
    when 'listen_type' then '{"text": "zzz"}'::jsonb
    when 'word_order' then '{"tokens": ["zzz"]}'::jsonb
    when 'word_bank' then '{"tokens": ["zzz"]}'::jsonb
    else '{"choice": "zzz"}'::jsonb
  end;
$$;

create function pg_temp.make_user(p_uid uuid, p_native text, p_learning text, p_level text default 'A1')
returns void language sql as $$
  insert into auth.users (id, raw_user_meta_data) values (p_uid, '{"first_name":"Test"}');
  insert into user_languages (user_id, language_code, role, cefr_level) values
    (p_uid, p_native, 'native', null),
    (p_uid, p_learning, 'learning', p_level::cefr_level);
$$;

create function pg_temp.xp(p_uid uuid) returns int language sql as $$
  select total_xp from user_progress where user_id = p_uid;
$$;

-- Answers every card of a run; the first p_wrong cards are answered wrongly.
-- Reads the key as owner, answers as the user. Returns the finish result.
create function pg_temp.play(p_uid uuid, p_run jsonb, p_wrong int default 0, p_finish boolean default true)
returns jsonb language plpgsql as $$
declare
  v_id uuid := (p_run ->> 'run_id')::uuid;
  v_ex jsonb;
  v_res jsonb;
  v_total int := (p_run ->> 'total')::int;
  i int;
begin
  for i in 0 .. v_total - 1 loop
    perform pg_temp.as_owner();
    select exercises -> i into v_ex from practice_runs where id = v_id;
    perform pg_temp.as_user(p_uid);
    v_res := answer_practice_card(v_id, i,
      case when i < p_wrong then pg_temp.wrong_answer(v_ex) else pg_temp.right_answer(v_ex) end);
    perform pg_temp.check((v_res ->> 'correct')::boolean = (i >= p_wrong),
      format('card %s (%s) graded %s, expected %s: %s', i, v_ex ->> 'type', v_res ->> 'correct', i >= p_wrong, v_ex));
  end loop;
  if not p_finish then return null; end if;
  perform pg_temp.as_user(p_uid);
  return finish_practice_run(v_id);
end $$;

\echo '--- users'
select pg_temp.make_user('a5000000-0000-0000-0000-000000000001', 'tr', 'de');
select pg_temp.make_user('a5000000-0000-0000-0000-000000000002', 'de', 'tr');
select pg_temp.make_user('a5000000-0000-0000-0000-000000000003', 'en', 'de');
select pg_temp.make_user('a5000000-0000-0000-0000-000000000004', 'tr', 'de');
select pg_temp.make_user('a5000000-0000-0000-0000-000000000005', 'en', 'fr');

-- ---------------------------------------------------------------------------
-- Runs start in several directions, with five cards and no answer keys.
-- ---------------------------------------------------------------------------
do $$
declare
  u uuid;
  r jsonb;
begin
  foreach u in array array[
    'a5000000-0000-0000-0000-000000000001'::uuid,   -- tr -> de
    'a5000000-0000-0000-0000-000000000002'::uuid,   -- de -> tr
    'a5000000-0000-0000-0000-000000000003'::uuid]   -- en -> de
  loop
    perform pg_temp.as_user(u);
    r := start_practice_run('quick');
    perform pg_temp.check((r ->> 'available')::boolean, 'quick run available');
    perform pg_temp.check((r ->> 'total')::int = 5 and jsonb_array_length(r -> 'exercises') = 5, 'five cards');
    perform pg_temp.check(r::text !~ '"(answer|concept_ids|accept|solution)"', 'no answer keys in the start payload');

    r := start_practice_run('daily');
    perform pg_temp.check((r ->> 'total')::int = 5, 'daily run has five cards');
    perform pg_temp.check(r::text !~ '"(answer|concept_ids|accept|solution)"', 'no answer keys in the daily payload');
  end loop;

  -- Quick styles.
  perform pg_temp.as_user('a5000000-0000-0000-0000-000000000001');
  foreach u in array array[null::uuid] loop null; end loop;
  perform pg_temp.check((start_practice_run('quick', 'type') ->> 'available')::boolean, 'quick: type style');
  perform pg_temp.check((start_practice_run('quick', 'build') ->> 'available')::boolean, 'quick: build style');
  perform pg_temp.check((start_practice_run('quick', 'meaning') ->> 'available')::boolean, 'quick: meaning style');
  perform pg_temp.raises($q$select start_practice_run('quick', 'nonsense')$q$, '23514', 'unknown style rejected');
  perform pg_temp.raises($q$select start_practice_run('weekly')$q$, '23514', 'unknown kind rejected');
  raise warning '✓ runs start in tr->de, de->tr, en->de with five stripped cards';
end $$;

-- A language with no course: a clear state, not an error.
do $$
declare r jsonb;
begin
  perform pg_temp.as_user('a5000000-0000-0000-0000-000000000005');
  r := start_practice_run('daily');
  perform pg_temp.check((r ->> 'available')::boolean is false and r ->> 'reason' = 'no_course', 'no course -> not available');
  r := get_play_overview();
  perform pg_temp.check(r -> 'daily_challenge' = 'null'::jsonb and r -> 'practice' = '[]'::jsonb,
    'overview shows nothing for a language without a course');
  raise warning '✓ unavailable languages return a clear state';
end $$;

-- ---------------------------------------------------------------------------
-- XP only at the end, and the rules.
-- ---------------------------------------------------------------------------
do $$
declare
  u constant uuid := 'a5000000-0000-0000-0000-000000000001';
  r jsonb;
  f jsonb;
  xp0 int;
begin
  perform pg_temp.as_owner();
  xp0 := pg_temp.xp(u);

  -- Daily, perfect: answering every card grants nothing until finish.
  perform pg_temp.as_user(u);
  r := start_practice_run('daily');
  perform pg_temp.play(u, r, 0, false);
  perform pg_temp.as_owner();
  perform pg_temp.check(pg_temp.xp(u) = xp0, 'no XP while answering cards');

  perform pg_temp.as_user(u);
  f := finish_practice_run((r ->> 'run_id')::uuid);
  perform pg_temp.check((f ->> 'xp_awarded')::int = 20 and (f ->> 'perfect')::boolean, 'first daily, perfect: 15 + 5');
  perform pg_temp.as_owner();
  perform pg_temp.check(pg_temp.xp(u) = xp0 + 20, 'XP granted once, at the end');

  -- Finishing again changes nothing.
  perform pg_temp.as_user(u);
  f := finish_practice_run((r ->> 'run_id')::uuid);
  perform pg_temp.check((f ->> 'already_completed')::boolean, 'second finish is a no-op');
  perform pg_temp.as_owner();
  perform pg_temp.check(pg_temp.xp(u) = xp0 + 20, 'XP not granted twice');

  -- A repeat daily the same day pays the reduced amount.
  perform pg_temp.as_user(u);
  r := start_practice_run('daily');
  f := pg_temp.play(u, r, 0);
  perform pg_temp.check((f ->> 'xp_awarded')::int = 10 and not (f ->> 'first_daily_today')::boolean, 'repeat daily: 5 + 5');
  r := get_play_overview();
  perform pg_temp.check((r -> 'daily_challenge' ->> 'completed_today')::boolean
    and (r -> 'daily_challenge' ->> 'xp_reward')::int = 5, 'overview: completed today, repeats pay 5');

  -- Quick: 10 XP at 3/5, no bonus; below the bar nothing.
  perform pg_temp.as_owner();
  xp0 := pg_temp.xp(u);
  perform pg_temp.as_user(u);
  f := pg_temp.play(u, start_practice_run('quick'), 2);
  perform pg_temp.check((f ->> 'correct')::int = 3 and (f ->> 'xp_awarded')::int = 10, 'quick 3/5: 10 XP');
  f := pg_temp.play(u, start_practice_run('quick'), 3);
  perform pg_temp.check((f ->> 'correct')::int = 2 and (f ->> 'xp_awarded')::int = 0, 'quick 2/5: no XP');
  f := pg_temp.play(u, start_practice_run('quick'), 0);
  perform pg_temp.check((f ->> 'xp_awarded')::int = 15, 'quick 5/5: 10 + 5');
  perform pg_temp.as_owner();
  perform pg_temp.check(pg_temp.xp(u) = xp0 + 25, 'ledger total matches');

  -- Finishing early is refused.
  perform pg_temp.as_user(u);
  r := start_practice_run('quick');
  perform pg_temp.raises(format($q$select finish_practice_run(%L)$q$, r ->> 'run_id'), '23514', 'cannot finish with unanswered cards');
  raise warning '✓ XP rules: once, at the end, daily repeat, quick, below the bar';
end $$;

-- ---------------------------------------------------------------------------
-- Daily is stable for a user within a day, and differs between users.
-- ---------------------------------------------------------------------------
do $$
declare
  a constant uuid := 'a5000000-0000-0000-0000-000000000003';
  b constant uuid := 'a5000000-0000-0000-0000-000000000001';
  r1 jsonb; r2 jsonb; r3 jsonb; rb jsonb;
  e1 jsonb; e2 jsonb;
begin
  perform pg_temp.as_user(a);
  r1 := start_practice_run('daily');
  -- Today's unfinished run is simply continued.
  r2 := start_practice_run('daily');
  perform pg_temp.check(r1 ->> 'run_id' = r2 ->> 'run_id', 'an unfinished daily run is resumed');

  -- After finishing, a new daily run has the same cards.
  perform pg_temp.play(a, r1, 0);
  perform pg_temp.as_user(a);
  r3 := start_practice_run('daily');
  perform pg_temp.check(r3 ->> 'run_id' <> r1 ->> 'run_id', 'a repeat is a new run');
  perform pg_temp.as_owner();
  select exercises into e1 from practice_runs where id = (r1 ->> 'run_id')::uuid;
  select exercises into e2 from practice_runs where id = (r3 ->> 'run_id')::uuid;
  perform pg_temp.check(e1 = e2, 'daily content is identical for the same user on the same day');

  perform pg_temp.as_user(b);
  rb := start_practice_run('daily');
  perform pg_temp.as_owner();
  perform pg_temp.check(
    (select exercises from practice_runs where id = (rb ->> 'run_id')::uuid) <> e1,
    'daily differs between users');

  -- The builder itself is deterministic for a fixed seed and state.
  perform pg_temp.as_owner();
  perform pg_temp.check(
    public.practice_build_cards(b, 'daily', null, true, 'de', 'tr', 'seed-1')
      = public.practice_build_cards(b, 'daily', null, true, 'de', 'tr', 'seed-1'),
    'the daily builder is deterministic for a fixed seed');
  perform pg_temp.check(
    public.practice_build_cards(b, 'daily', null, true, 'de', 'tr', 'seed-1')
      <> public.practice_build_cards(b, 'daily', null, true, 'de', 'tr', 'seed-2'),
    'a different seed gives a different deck');

  -- Quick is random: two calls differ (overwhelmingly likely with this much content).
  perform pg_temp.as_user(a);
  r1 := start_practice_run('quick');
  r2 := start_practice_run('quick');
  perform pg_temp.as_owner();
  perform pg_temp.check(
    (select exercises from practice_runs where id = (r1 ->> 'run_id')::uuid)
    <> (select exercises from practice_runs where id = (r2 ->> 'run_id')::uuid),
    'quick runs are random');
  raise warning '✓ daily is stable per user per day, different between users';
end $$;

-- ---------------------------------------------------------------------------
-- Ownership, idempotency, spaced repetition.
-- ---------------------------------------------------------------------------
do $$
declare
  a constant uuid := 'a5000000-0000-0000-0000-000000000002';
  b constant uuid := 'a5000000-0000-0000-0000-000000000004';
  r jsonb;
  v_id uuid;
  v_ex jsonb;
  first_verdict jsonb;
  again jsonb;
  seen_before int;
begin
  perform pg_temp.as_user(a);
  r := start_practice_run('quick');
  v_id := (r ->> 'run_id')::uuid;

  -- Another user can neither read nor answer nor finish it.
  perform pg_temp.as_user(b);
  perform pg_temp.check(get_practice_run(v_id) is null, 'another user cannot read the run');
  perform pg_temp.raises(format($q$select answer_practice_card(%L, 0, '{}')$q$, v_id), '42501', 'another user cannot answer');
  perform pg_temp.raises(format($q$select finish_practice_run(%L)$q$, v_id), '42501', 'another user cannot finish');
  perform pg_temp.raises($q$select * from practice_runs$q$, '42501', 'no direct table access');

  -- Answering a card twice keeps the first verdict (even if the second is right).
  perform pg_temp.as_owner();
  select exercises -> 0 into v_ex from practice_runs where id = v_id;
  select count(*) into seen_before from user_concept_progress where user_id = a;
  perform pg_temp.as_user(a);
  first_verdict := answer_practice_card(v_id, 0, pg_temp.wrong_answer(v_ex));
  again := answer_practice_card(v_id, 0, pg_temp.right_answer(v_ex));
  perform pg_temp.check(first_verdict = again and (again ->> 'correct')::boolean is false, 'answering twice returns the first verdict');
  perform pg_temp.raises(format($q$select answer_practice_card(%L, -1, '{}')$q$, v_id), '23514', 'negative index rejected');
  perform pg_temp.raises(format($q$select answer_practice_card(%L, 99, '{}')$q$, v_id), '23514', 'out-of-range index rejected');

  -- The answer feeds spaced repetition, like lessons.
  perform pg_temp.as_owner();
  perform pg_temp.check(
    (select count(*) from user_concept_progress where user_id = a) > seen_before
    or exists (select 1 from user_concept_progress where user_id = a and last_result is false),
    'answers update user_concept_progress');
  raise warning '✓ ownership, idempotency and spaced repetition';
end $$;

-- ---------------------------------------------------------------------------
-- Missions and partner challenges still work: the template engine is untouched.
-- ---------------------------------------------------------------------------
do $$
begin
  perform pg_temp.as_owner();
  perform pg_temp.check(exists (select 1 from game_templates where is_active), 'game templates still exist');
  perform pg_temp.check(exists (select 1 from pg_proc where proname = 'start_game_session'), 'start_game_session still exists');
  raise warning '✓ practice run checks passed';
end $$;
