-- test_learning_engine.sql
-- End-to-end checks of the content engine, run by supabase/tests/run.sh
-- against a scratch database. Every check raises on failure.
--
-- Plays real lessons through the same RPCs the app calls, as the
-- `authenticated` role with auth.uid() set, in these directions:
--   tr->de, de->tr, tr->es, es->tr, tr->nl, nl->tr, de->es, en->de

\set ON_ERROR_STOP 1
set client_min_messages = warning;

-- ---------------------------------------------------------------------------
-- Helpers (session-local, dropped with the connection)
-- ---------------------------------------------------------------------------

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
  if p_ok is not true then
    raise exception 'FAILED: %', p_msg;
  end if;
end $$;

-- The answer a perfect learner would give, read (as owner) from the stored key.
create function pg_temp.right_answer(p_ex jsonb) returns jsonb language sql as $$
  select case p_ex ->> 'type'
    when 'new_words' then '{}'::jsonb
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

-- Plays one session to the end. p_miss: index of a graded exercise to get
-- wrong on the first attempt (or null for a perfect run).
create function pg_temp.play(p_uid uuid, p_session jsonb, p_miss int default null)
returns jsonb language plpgsql as $$
declare
  v_id uuid := (p_session ->> 'session_id')::uuid;
  v_ex jsonb;
  v_res jsonb;
  v_i int := 0;
  v_total int;
begin
  loop
    perform pg_temp.as_owner();
    select exercises -> v_i, jsonb_array_length(exercises) into v_ex, v_total
    from lesson_sessions where id = v_id;
    exit when v_i >= v_total;

    perform pg_temp.as_user(p_uid);
    v_res := answer_lesson_exercise(v_id, v_i,
      case when v_i = p_miss then pg_temp.wrong_answer(v_ex) else pg_temp.right_answer(v_ex) end);

    if v_ex ->> 'type' <> 'new_words' then
      perform pg_temp.check((v_res ->> 'correct')::boolean = (v_i is distinct from p_miss),
        format('exercise %s (%s) graded %s, expected %s: %s', v_i, v_ex ->> 'type',
               v_res ->> 'correct', v_i is distinct from p_miss, v_ex));
    end if;
    if v_i = p_miss then
      perform pg_temp.check(v_res -> 'appended' ->> 'is_retry' = 'true', 'a miss queues a retry');
    end if;
    v_i := v_i + 1;
  end loop;

  perform pg_temp.as_user(p_uid);
  return complete_lesson_session(v_id);
end $$;

-- Structural checks on what the browser receives.
create function pg_temp.check_payload(p_session jsonb) returns void language plpgsql as $$
declare
  e jsonb;
  v_types text[] := '{}';
  v_graded int := 0;
  v_choices jsonb;
begin
  perform pg_temp.check(p_session::text !~ '"(answer|concept_ids|accept|solution)"',
    'no answer keys reach the client');

  for e in select * from jsonb_array_elements(p_session -> 'exercises') loop
    v_types := v_types || (e ->> 'type');
    if e ->> 'type' <> 'new_words' then v_graded := v_graded + 1; end if;
    v_choices := e -> 'payload' -> 'choices';
    if v_choices is not null then
      perform pg_temp.check(jsonb_array_length(v_choices) >= 3,
        format('%s has at least 3 options: %s', e ->> 'type', v_choices));
      perform pg_temp.check(
        (select count(distinct public.learn_fold(x)) from jsonb_array_elements_text(v_choices) x)
          = jsonb_array_length(v_choices),
        format('%s options are distinguishable: %s', e ->> 'type', v_choices));
    end if;
  end loop;

  perform pg_temp.check(v_graded between 8 and 13, format('8-13 graded exercises, got %s', v_graded));
  perform pg_temp.check((select count(distinct t) from unnest(v_types) t) >= 6,
    format('at least 6 different mechanics, got %s', v_types));
end $$;

-- ---------------------------------------------------------------------------
-- Content sanity
-- ---------------------------------------------------------------------------
do $$
begin
  perform pg_temp.check((select count(*) from courses) >= 5, 'five courses');
  perform pg_temp.check(
    (select bool_and(n >= 300) from (
       select count(*) n from concept_translations where status = 'active'
       group by language_code) x),
    'every language has at least 300 texts');
  perform pg_temp.check(not exists (
    select 1 from content_sources where is_enabled
      and (not commercial_use_allowed or not modification_allowed or share_alike)),
    'no enabled source with an unusable licence');
  perform pg_temp.check(not exists (
    select 1 from concept_translations ct join content_sources s on s.id = ct.source_id
    where s.requires_item_attribution and ct.source_external_id is null),
    'items from attribution-required sources carry their source id');
end $$;

-- ---------------------------------------------------------------------------
-- Directions
-- ---------------------------------------------------------------------------
do $$
declare
  d record;
  v_uid uuid;
  v_ov jsonb;
  v_session jsonb;
  v_done jsonb;
  v_lesson bigint;
  v_xp int;
  n int := 0;
begin
  for d in select * from (values
    ('tr', 'de'), ('de', 'tr'), ('tr', 'es'), ('es', 'tr'),
    ('tr', 'nl'), ('nl', 'tr'), ('de', 'es'), ('en', 'de')
  ) as v(native, target)
  loop
    n := n + 1;
    v_uid := ('00000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid;
    perform pg_temp.make_user(v_uid, d.native, d.target);

    perform pg_temp.as_user(v_uid);
    v_ov := get_learn_overview();
    perform pg_temp.check(v_ov -> 'course' -> 'target' ->> 'code' = d.target, 'overview target');
    perform pg_temp.check(v_ov -> 'course' -> 'known' ->> 'code' = d.native, 'overview known = native');
    perform pg_temp.check(jsonb_array_length(v_ov -> 'units') >= 5, 'overview lists units');
    perform pg_temp.check((v_ov -> 'next_lesson' ->> 'id') is not null, 'overview has a next lesson');

    -- Three different lessons, one with a deliberate miss.
    for v_lesson in
      select (l ->> 'id')::bigint
      from jsonb_array_elements(v_ov -> 'units') u,
           jsonb_array_elements(u -> 'skills') s,
           jsonb_array_elements(s -> 'lessons') l
      where s ->> 'key' in ('greetings', 'drinks', 'family')
        and l ->> 'lesson_type' = 'learn'
      limit 3
    loop
      v_session := start_lesson(v_lesson, true);
      perform pg_temp.check(v_session -> 'known' ->> 'code' = d.native, 'session known language');
      perform pg_temp.check_payload(v_session);
      v_done := pg_temp.play(v_uid, v_session, 2);
      perform pg_temp.check((v_done ->> 'xp_awarded')::int = 15,
        format('first completion with a miss earns 15 XP: %s', v_done));
      perform pg_temp.check((v_done ->> 'perfect')::boolean is false, 'a miss is not perfect');
    end loop;

    -- Replay the last lesson perfectly: 5 + 5.
    v_session := start_lesson(v_lesson, false);
    perform pg_temp.check(v_session::text !~ '"listen_', 'no listening exercises when audio is off');
    v_done := pg_temp.play(v_uid, v_session, null);
    perform pg_temp.check((v_done ->> 'xp_awarded')::int = 10, format('perfect replay earns 10 XP: %s', v_done));
    perform pg_temp.check((v_done ->> 'score')::int = 100, 'perfect score');

    -- Review: items seen in the lessons come back.
    v_session := start_review(true);
    perform pg_temp.check(jsonb_array_length(v_session -> 'exercises') >= 5, 'review has exercises');
    perform pg_temp.check(v_session::text !~ '"(answer|concept_ids|accept)"', 'review hides answers');
    v_done := pg_temp.play(v_uid, v_session, null);
    perform pg_temp.check((v_done ->> 'xp_awarded')::int = 15, format('perfect review earns 15 XP: %s', v_done));

    perform pg_temp.as_owner();
    select total_xp into v_xp from user_progress where user_id = v_uid;
    perform pg_temp.check(v_xp = 15 * 3 + 10 + 15, format('XP ledger adds up (%s)', v_xp));
    perform pg_temp.check((select current_streak_days from user_progress where user_id = v_uid) = 1, 'streak started');
    perform pg_temp.check((select count(*) from user_lesson_progress where user_id = v_uid) = 3, 'lesson progress stored');
    perform pg_temp.check(
      (select count(*) from user_concept_progress where user_id = v_uid and language_code = d.target) >= 12,
      'SRS rows stored for the target language');
    -- The deliberately missed item is back in the (re)learning box.
    perform pg_temp.check(
      exists (select 1 from user_concept_progress where user_id = v_uid and incorrect_count > 0),
      'a miss is recorded');

    raise warning '✓ % -> %: lessons, retry, replay, review, XP %', d.native, d.target, v_xp;
  end loop;
  perform pg_temp.as_owner();
end $$;

-- ---------------------------------------------------------------------------
-- "Can't listen now" skips are shown the answer and not scored
-- ---------------------------------------------------------------------------
do $$
declare
  v_uid uuid := '00000000-0000-0000-0000-000000000004';
  v_session jsonb;
  v_id uuid;
  v_idx int;
  v_res jsonb;
begin
  perform pg_temp.as_user(v_uid);
  v_session := start_review(true);
  v_id := (v_session ->> 'session_id')::uuid;
  select (e ->> 'index')::int into v_idx
  from jsonb_array_elements(v_session -> 'exercises') e
  where e ->> 'type' in ('listen_choice', 'listen_type') limit 1;
  if v_idx is not null then
    v_res := answer_lesson_exercise(v_id, v_idx, '{"skip": true}');
    perform pg_temp.check(v_res ->> 'graded' = 'false' and v_res ->> 'note' = 'skipped'
      and v_res -> 'appended' = 'null'::jsonb, format('skip is ungraded: %s', v_res));
  end if;
  v_res := answer_lesson_exercise(v_id, 0, '{"skip": true}');
  perform pg_temp.check(v_res ->> 'graded' = 'true' or (v_session -> 'exercises' -> 0 ->> 'type') in ('listen_choice', 'listen_type'),
    'skip only applies to listening exercises');
  perform pg_temp.as_owner();
end $$;

-- ---------------------------------------------------------------------------
-- Answer-key integrity: no second key via negative indices; a repeated call
-- still reports the retry it queued; guessing earns no XP.
-- ---------------------------------------------------------------------------
do $$
declare
  v_uid uuid := '00000000-0000-0000-0000-000000000005';
  v_session jsonb;
  v_id uuid;
  v_n int;
  v_first jsonb;
  v_again jsonb;
  v_done jsonb;
  v_denied boolean;
  v_idx int;
begin
  perform pg_temp.as_user(v_uid);
  v_session := start_review(false);
  v_id := (v_session ->> 'session_id')::uuid;
  v_n := jsonb_array_length(v_session -> 'exercises');

  begin
    perform answer_lesson_exercise(v_id, -1, '{"choice": "x"}');
    v_denied := false;
  exception when check_violation then v_denied := true;
  end;
  perform pg_temp.check(v_denied, 'negative exercise index rejected');
  begin
    perform answer_lesson_exercise(v_id, v_n, '{"choice": "x"}');
    v_denied := false;
  exception when check_violation then v_denied := true;
  end;
  perform pg_temp.check(v_denied, 'out-of-range exercise index rejected');

  -- Everything wrong; the first miss queues a retry that a repeated call returns too.
  for v_idx in 0 .. v_n - 1 loop
    v_first := answer_lesson_exercise(v_id, v_idx, '{"choice": "zzz", "text": "zzz", "tokens": ["zzz"], "value": null, "pairs": {}}');
    if v_idx = 0 then
      v_again := answer_lesson_exercise(v_id, 0, '{}');
      perform pg_temp.check(v_again -> 'appended' ->> 'index' = v_first -> 'appended' ->> 'index',
        format('replayed answer reports its retry: %s / %s', v_first, v_again));
    end if;
  end loop;
  -- Answer the queued retries too (at most three).
  for v_idx in v_n .. v_n + 2 loop
    begin
      perform answer_lesson_exercise(v_id, v_idx, '{"choice": "zzz"}');
    exception when check_violation then null;
    end;
  end loop;
  v_done := complete_lesson_session(v_id);
  perform pg_temp.check((v_done ->> 'xp_awarded')::int = 0, format('guessing earns no XP: %s', v_done));
  perform pg_temp.as_owner();
end $$;

-- ---------------------------------------------------------------------------
-- Spaced repetition rules
-- ---------------------------------------------------------------------------
do $$
declare
  v_uid uuid := '00000000-0000-0000-0000-000000000001';
  v_c bigint := (select id from concepts where key = 'coffee');
  p record;
begin
  delete from user_concept_progress where user_id = v_uid and concept_id = v_c and language_code = 'de';

  perform learn_record_result(v_uid, 'de', v_c, true);
  select * into p from user_concept_progress where user_id = v_uid and concept_id = v_c and language_code = 'de';
  perform pg_temp.check(p.box = 1 and p.next_review_at > now() + interval '23 hours', 'new + right -> box 1, tomorrow');

  perform learn_record_result(v_uid, 'de', v_c, true);
  select * into p from user_concept_progress where user_id = v_uid and concept_id = v_c and language_code = 'de';
  perform pg_temp.check(p.box = 1, 'right again before due -> no promotion');

  update user_concept_progress set next_review_at = now() - interval '1 minute'
  where user_id = v_uid and concept_id = v_c and language_code = 'de';
  perform learn_record_result(v_uid, 'de', v_c, true);
  select * into p from user_concept_progress where user_id = v_uid and concept_id = v_c and language_code = 'de';
  perform pg_temp.check(p.box = 2 and p.next_review_at > now() + interval '2 days', 'due + right -> box 2, 3 days');

  perform learn_record_result(v_uid, 'de', v_c, false);
  select * into p from user_concept_progress where user_id = v_uid and concept_id = v_c and language_code = 'de';
  perform pg_temp.check(p.box = 0 and p.next_review_at < now() + interval '11 minutes' and p.streak = 0,
    'wrong -> down two boxes, back in 10 minutes');
end $$;

-- ---------------------------------------------------------------------------
-- Grading edge cases
-- ---------------------------------------------------------------------------
do $$
declare
  ex jsonb := '{"type":"type_translation","concept_ids":[1],"answer":{"accept":["die Straße","Straße"]}}';
begin
  perform pg_temp.check((learn_grade(ex, '{"text":"Straße"}') ->> 'correct')::boolean, 'article optional');
  perform pg_temp.check((learn_grade(ex, '{"text":"  DIE straße!! "}') ->> 'correct')::boolean, 'case and punctuation ignored');
  perform pg_temp.check(learn_grade(ex, '{"text":"strasse"}') ->> 'note' = 'accents', 'ß/ss accepted with an accent note');
  perform pg_temp.check(not (learn_grade(ex, '{"text":"Strand"}') ->> 'correct')::boolean, 'wrong word rejected');
  perform pg_temp.check(not (learn_grade(ex, '{"text":""}') ->> 'correct')::boolean, 'empty answer rejected');
  perform pg_temp.check(learn_fold('Iğdır ÇAY İstanbul') = learn_fold('igdir cay istanbul'), 'Turkish folding');
  perform pg_temp.check(learn_norm('¿Cómo estás?') = 'cómo estás', 'Spanish punctuation');
  perform pg_temp.check(learn_norm('Türkiye''de') = 'türkiyede', 'apostrophes joined');
end $$;

-- ---------------------------------------------------------------------------
-- Distractors stay on topic
-- ---------------------------------------------------------------------------
do $$
declare
  v_opts text[];
  v_on_topic int;
begin
  v_opts := learn_word_distractors((select id from concepts where key = 'coffee'), 'tr', 3, array['kahve']);
  select count(*) into v_on_topic
  from unnest(v_opts) o
  join concept_translations ct on ct.text = o and ct.language_code = 'tr'
  join concepts c on c.id = ct.concept_id and c.topic = 'drinks';
  perform pg_temp.check(v_on_topic = 3, format('coffee distractors are drinks: %s', v_opts));

  v_opts := learn_word_distractors((select id from concepts where key = 'day-mon'), 'de', 3, array['Montag']);
  perform pg_temp.check(v_opts <@ array['Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'],
    format('Monday distractors are weekdays: %s', v_opts));
end $$;

-- ---------------------------------------------------------------------------
-- Security boundary
-- ---------------------------------------------------------------------------
do $$
declare
  v_uid uuid := '00000000-0000-0000-0000-000000000001';
  v_other uuid := '00000000-0000-0000-0000-000000000002';
  v_count int;
  v_denied boolean;
begin
  perform pg_temp.as_user(v_uid);

  select count(*) into v_count from concepts;
  perform pg_temp.check(v_count = 0, 'concepts are not readable by clients');
  select count(*) into v_count from concept_translations;
  perform pg_temp.check(v_count = 0, 'translations are not readable by clients');
  select count(*) into v_count from lesson_sessions;
  perform pg_temp.check(v_count = 0, 'lesson sessions (answer keys) are not readable');
  select count(*) into v_count from user_concept_progress where user_id <> v_uid;
  perform pg_temp.check(v_count = 0, 'other learners'' SRS rows are invisible');
  select count(*) into v_count from units;
  perform pg_temp.check(v_count > 0, 'curriculum structure is readable');

  begin
    insert into concepts (key, kind, cefr_level, topic, gloss, source_id)
    values ('hack', 'word', 'A1', 'x', 'x', 'lingua-match-editorial');
    v_denied := false;
  exception when insufficient_privilege then v_denied := true;
  end;
  perform pg_temp.check(v_denied, 'clients cannot write canonical content');

  begin
    update user_progress set total_xp = 99999 where user_id = v_uid;
    get diagnostics v_count = row_count;
    v_denied := v_count = 0;
  exception when insufficient_privilege then v_denied := true;
  end;
  perform pg_temp.check(v_denied, 'clients cannot write XP');

  begin
    update user_concept_progress set box = 5 where user_id = v_uid;
    v_denied := false;
  exception when insufficient_privilege then v_denied := true;
  end;
  perform pg_temp.check(v_denied, 'clients cannot write SRS state');

  begin
    perform learn_build_exercise('vocab_choice', 1, 'de', 'tr');
    v_denied := false;
  exception when insufficient_privilege then v_denied := true;
  end;
  perform pg_temp.check(v_denied, 'internal builders are not callable');

  begin
    perform answer_lesson_exercise(
      (select s.id from lesson_sessions s where false), 0, '{}');
    v_denied := false;
  exception when others then v_denied := true;
  end;
  perform pg_temp.check(v_denied, 'answering a missing session fails');

  -- Someone else's session is not yours to answer.
  perform pg_temp.as_owner();
  perform pg_temp.as_user(v_other);
  begin
    perform answer_lesson_exercise(
      (select id from lesson_sessions where user_id = v_uid limit 1), 0, '{}');
    v_denied := false;
  exception when insufficient_privilege then v_denied := true;
  end;
  perform pg_temp.as_owner();
  perform pg_temp.check(v_denied, 'cannot answer another learner''s session');

  execute 'set role anon';
  perform pg_temp.check(jsonb_array_length(get_content_attributions()) >= 3, 'attributions are public');
  begin
    perform start_review(true);
    v_denied := false;
  exception when insufficient_privilege then v_denied := true;
  end;
  perform pg_temp.as_owner();
  perform pg_temp.check(v_denied, 'anonymous users cannot start lessons');
end $$;

-- ---------------------------------------------------------------------------
-- Social: a learned phrase used in a real chat
-- ---------------------------------------------------------------------------
do $$
declare
  v_a uuid := '00000000-0000-0000-0000-000000000001';   -- tr native, learning de
  v_b uuid := '00000000-0000-0000-0000-000000000002';   -- de native, learning tr
  v_match uuid;
  v_share jsonb;
  v_before int;
  v_after int;
  v_phrase bigint := (select id from concepts where key = 's.how-was-day');
  v_session uuid;
begin
  insert into matches (user_a, user_b) values (least(v_a, v_b), greatest(v_a, v_b)) returning id into v_match;
  select total_xp into v_before from user_progress where user_id = v_a;

  perform pg_temp.as_user(v_a);
  v_share := share_phrase_with_match(v_match, v_phrase);
  perform pg_temp.as_owner();
  perform pg_temp.check(v_share ->> 'text' = 'Wie war dein Tag?', format('phrase in the learning language: %s', v_share));

  perform pg_temp.as_user(v_a);
  insert into messages (match_id, sender_id, body)
  values (v_match, v_a, 'Hallo! Wie war dein Tag? 🙂');
  perform pg_temp.as_owner();

  select total_xp into v_after from user_progress where user_id = v_a;
  perform pg_temp.check(v_after = v_before + 10, format('using the phrase earns 10 XP (%s -> %s)', v_before, v_after));
  perform pg_temp.check((select used_at is not null from phrase_shares where id = (v_share ->> 'share_id')::uuid),
    'share marked used');

  -- Not a member: refused.
  perform pg_temp.as_user('00000000-0000-0000-0000-000000000003');
  begin
    perform share_phrase_with_match(v_match, v_phrase);
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  perform pg_temp.as_owner();

  -- Reporting content from inside a session.
  v_session := (select id from lesson_sessions where user_id = v_a order by created_at desc limit 1);
  perform pg_temp.as_user(v_a);
  perform flag_lesson_content(v_session, 1, 'wrong_translation', 'test');
  perform pg_temp.as_owner();
  perform pg_temp.check((select count(*) from content_flags where reporter_id = v_a) >= 1, 'flag stored');
end $$;

\echo all learning-engine checks passed
