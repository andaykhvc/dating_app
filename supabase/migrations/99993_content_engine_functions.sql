-- 99993_content_engine_functions.sql
-- Lesson generation, grading, spaced repetition and the social hook.
--
-- Everything that decides a right answer runs here, for the same reason the
-- existing game engine grades in Postgres: the browser never holds an answer
-- key it has not already committed against, and XP is only ever granted by
-- code that just validated something. The one deliberate exception is
-- listening: the device speaks the text, so listen_choice / listen_type carry
-- it in `speak`. They are low-stakes, and XP needs a mostly-correct session. Generation is deterministic SQL over
-- our own tables -- no AI, no external API, no per-question network cost.

-- ---------------------------------------------------------------------------
-- Text normalisation used for grading, de-duplication and distractor checks.
-- ---------------------------------------------------------------------------

-- Case, punctuation and whitespace stop mattering; accents still do.
-- Apostrophes are dropped rather than spaced so "I'm" == "Im" and Turkish
-- suffixes ("Türkiye'de") stay one word.
--
-- Written to give the same answer under any database locale: accented
-- capitals are lowered explicitly (lower() only knows ASCII under "C"), and
-- punctuation is removed by naming it rather than by keeping [:alnum:], which
-- under "C" would strip every non-ASCII letter.
create or replace function public.learn_norm(p text)
returns text
language sql
immutable
parallel safe
as $$
  select btrim(regexp_replace(
    regexp_replace(
      regexp_replace(
        translate(
          lower(replace(normalize(coalesce(p, ''), NFC), 'İ', 'i')),
          'ÁÀÂÄÃÅĀÇĆČÉÈÊËĒĘĖĞÍÌÎÏĪŁÑŃŇÓÒÔÖÕØŌŐŚŞŠÚÙÛÜŪŰŮÝŸŹŻŽ',
          'áàâäãåāçćčéèêëēęėğíìîïīłñńňóòôöõøōőśşšúùûüūűůýÿźżž'),
        '[''’‘`´]', '', 'g'),
      '[[:punct:]¿¡«»“”„–—…·•]+', ' ', 'g'),
    '\s+', ' ', 'g'));
$$;

-- learn_norm plus accent folding, for "right apart from the accents" and for
-- spotting options that would look identical to a learner.
create or replace function public.learn_fold(p text)
returns text
language sql
immutable
parallel safe
as $$
  select translate(
    replace(public.learn_norm(p), 'ß', 'ss'),
    'áàâäãåāçćčéèêëēęėğíìîïīıłñńňóòôöõøōőśşšúùûüūűůýÿźżž',
    'aaaaaaaccceeeeeeegiiiiiilnnnoooooooosssuuuuuuuyyzzz'
  );
$$;

alter table concept_translations
  add column folded text generated always as (public.learn_fold(text)) stored;

create index concept_translations_folded_idx
  on concept_translations (language_code, folded);

-- Item-level credit link for sources that need one (Tatoeba: "{id}").
alter table content_sources add column if not exists item_url_template text;

-- ---------------------------------------------------------------------------
-- Small internal helpers. None of these are callable from the client.
-- ---------------------------------------------------------------------------

create or replace function public.learn_shuffle(p jsonb)
returns jsonb
language sql
volatile
as $$
  select coalesce(jsonb_agg(e order by random()), '[]'::jsonb)
  from jsonb_array_elements(p) e;
$$;

-- The language the learner already knows: their native language when we have
-- content in it, otherwise English (the UI language), otherwise any course
-- language that is not the target.
create or replace function public.learn_known_language(p_native text, p_target text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p_native where p_native is not null and p_native <> p_target
       and exists (select 1 from concept_translations
                   where language_code = p_native and status = 'active')),
    (select 'en' where p_target <> 'en'),
    (select c.language_code from courses c
     where c.language_code <> p_target and c.is_published
     order by c.language_code limit 1)
  );
$$;

-- Leitner intervals. Box 0 is (re)learning and comes back within minutes.
create or replace function public.learn_box_interval(p_box smallint)
returns interval
language sql
immutable
as $$
  select case p_box
    when 0 then interval '10 minutes'
    when 1 then interval '1 day'
    when 2 then interval '3 days'
    when 3 then interval '7 days'
    when 4 then interval '14 days'
    else interval '30 days'
  end;
$$;

-- Credit line for an item whose source requires per-item attribution.
create or replace function public.learn_credit(p_translation_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'source', s.name,
    'author', ct.source_author,
    'license', coalesce(ct.license, s.license),
    'url', case when s.item_url_template is not null and ct.source_external_id is not null
                then replace(s.item_url_template, '{id}', ct.source_external_id) end
  )
  from concept_translations ct
  join content_sources s on s.id = ct.source_id
  where ct.id = p_translation_id and s.requires_item_attribution;
$$;

-- ---------------------------------------------------------------------------
-- Distractors. Deterministic ranking over our own data, randomised only among
-- equally good candidates:
--   same kind -> same part of speech -> same topic -> same skill -> level,
-- never a near-synonym (sense_group), never something that folds to the same
-- text as the answer or another option.
-- ---------------------------------------------------------------------------

create or replace function public.learn_word_distractors(
  p_concept_id bigint,
  p_lang text,
  p_n int,
  p_exclude text[] default '{}'
)
returns text[]
language sql
volatile
security definer
set search_path = public
as $$
  with t as (select * from concepts where id = p_concept_id),
  cand as (
    select distinct on (ct.folded)
      ct.text,
      (c.part_of_speech is not distinct from t.part_of_speech)::int * 8
        + (c.topic = t.topic)::int * 4
        + (c.skill_id is not distinct from t.skill_id)::int * 2
        + (c.cefr_level <= t.cefr_level)::int as score,
      random() as r
    from t
    join concepts c
      on c.kind = t.kind and c.id <> t.id and c.status = 'active'
     and (t.sense_group is null or c.sense_group is distinct from t.sense_group)
    join concept_translations ct
      on ct.concept_id = c.id and ct.language_code = p_lang and ct.status = 'active'
    where ct.folded <> all (select public.learn_fold(x) from unnest(p_exclude) x)
    order by ct.folded, score desc, r
  )
  select coalesce(array_agg(text order by score desc, r), '{}')
  from (select * from cand order by score desc, r limit greatest(p_n, 0)) s;
$$;

-- Whole sentences / phrases in one language. p_same_topic = false is used by
-- context choice, where an option from the same situation might also fit.
create or replace function public.learn_sentence_distractors(
  p_concept_id bigint,
  p_lang text,
  p_n int,
  p_exclude text[] default '{}',
  p_same_topic boolean default true
)
returns text[]
language sql
volatile
security definer
set search_path = public
as $$
  with t as (
    select c.*, ct.text as t_text,
           (select u.unit_id from skills u where u.id = c.skill_id) as unit_id
    from concepts c
    left join concept_translations ct
      on ct.concept_id = c.id and ct.language_code = p_lang
    where c.id = p_concept_id
  ),
  cand as (
    select distinct on (ct.folded)
      ct.text,
      case when p_same_topic
        then (c.skill_id is not distinct from t.skill_id)::int * 6
             + (c.topic = t.topic)::int * 3
        else (c.topic <> t.topic)::int * 6
             + (sk.unit_id is not distinct from t.unit_id)::int * 3
      end
      + (c.cefr_level <= t.cefr_level)::int * 2
      - least(abs(char_length(ct.text) - char_length(coalesce(t.t_text, ct.text))) / 12, 3)
        as score,
      random() as r
    from t
    join concepts c
      on c.kind in ('sentence', 'phrase') and c.id <> t.id and c.status = 'active'
     and (t.sense_group is null or c.sense_group is distinct from t.sense_group)
    left join skills sk on sk.id = c.skill_id
    join concept_translations ct
      on ct.concept_id = c.id and ct.language_code = p_lang and ct.status = 'active'
    where ct.folded <> all (select public.learn_fold(x) from unnest(p_exclude) x)
      and (c.kind = 'sentence' or cardinality(ct.tokens) >= 2)
    order by ct.folded, score desc, r
  )
  select coalesce(array_agg(text order by score desc, r), '{}')
  from (select * from cand order by score desc, r limit greatest(p_n, 0)) s;
$$;

-- Wrong options for a gap: words other sentences blank out, of the same part
-- of speech, preferring the same ending ("trinke" -> "wohne", "spiele") so a
-- grammar slip is not a giveaway; topped up with dictionary words of the same
-- part of speech. Never a word that already appears in the sentence.
create or replace function public.learn_cloze_distractors(
  p_translation_id bigint,
  p_n int
)
returns text[]
language sql
volatile
security definer
set search_path = public
as $$
  with t as (
    select ct.*, c.skill_id, c.topic,
           ct.tokens[ct.cloze_index + 1] as answer,
           public.learn_fold(ct.tokens[ct.cloze_index + 1]) as answer_fold,
           array(select public.learn_fold(x) from unnest(ct.tokens) x) as sentence_folds
    from concept_translations ct
    join concepts c on c.id = ct.concept_id
    where ct.id = p_translation_id and ct.cloze_index is not null
  ),
  raw as (
    select o.tokens[o.cloze_index + 1] as word,
           (o.cloze_pos is not distinct from t.cloze_pos)::int * 8
             + (right(public.learn_fold(o.tokens[o.cloze_index + 1]), 2)
                = right(t.answer_fold, 2))::int * 2
             + (right(public.learn_fold(o.tokens[o.cloze_index + 1]), 1)
                = right(t.answer_fold, 1))::int * 2
             + (c.skill_id is not distinct from t.skill_id)::int * 2
             + (c.topic = t.topic)::int as score
    from t
    join concept_translations o
      on o.language_code = t.language_code and o.status = 'active'
     and o.cloze_index is not null and o.id <> t.id
    join concepts c on c.id = o.concept_id and c.status = 'active'
    union all
    -- Dictionary top-up: a single word, or a noun's last token (no article).
    -- Same topic weighs more here than for sentence gaps, so a country gap is
    -- offered other countries rather than any noun some sentence blanked.
    select w.tokens[cardinality(w.tokens)],
           (c.part_of_speech is not distinct from t.cloze_pos)::int * 6
             + (c.topic = t.topic)::int * 4
             + (right(public.learn_fold(w.tokens[cardinality(w.tokens)]), 2)
                = right(t.answer_fold, 2))::int * 2
    from t
    join concept_translations w
      on w.language_code = t.language_code and w.status = 'active'
     and w.tokens is not null
    join concepts c
      on c.id = w.concept_id and c.status = 'active' and c.kind = 'word'
     and (cardinality(w.tokens) = 1
          or (c.part_of_speech = 'noun' and cardinality(w.tokens) = 2))
  ),
  cand as (
    select distinct on (public.learn_fold(word))
      -- Options wear the answer's case so case never gives it away: a gap at
      -- the start of a sentence gets capitalised options, and outside German
      -- (where case is positional) a mid-sentence gap gets lower-case ones.
      case
        when t.cloze_index = 0 then upper(left(word, 1)) || substr(word, 2)
        when t.language_code <> 'de' and left(t.answer, 1) = lower(left(t.answer, 1))
          then lower(replace(left(word, 1), 'İ', 'i')) || substr(word, 2)
        else word
      end as word,
      score, random() as r
    from raw, t
    where word is not null
      and public.learn_fold(word) <> t.answer_fold
      and not (public.learn_fold(word) = any (t.sentence_folds))
      -- Mid-sentence in German, case is grammar: a noun gap must not be the
      -- only capitalised option (or the only lower-case one).
      and (t.language_code <> 'de' or t.cloze_index = 0
           or (left(word, 1) = lower(left(word, 1))) = (left(t.answer, 1) = lower(left(t.answer, 1))))
    order by public.learn_fold(word), score desc, random()
  )
  select coalesce(array_agg(word order by score desc, r), '{}')
  from (select * from cand order by score desc, r limit greatest(p_n, 0)) s;
$$;

-- Decoy tiles for "translate with word tiles": words from other sentences in
-- the same skill that are not in the answer.
create or replace function public.learn_tile_decoys(
  p_translation_id bigint,
  p_n int
)
returns text[]
language sql
volatile
security definer
set search_path = public
as $$
  with t as (
    select ct.*, c.skill_id,
           array(select public.learn_fold(x) from unnest(ct.tokens) x) as folds
    from concept_translations ct
    join concepts c on c.id = ct.concept_id
    where ct.id = p_translation_id
  ),
  words as (
    select distinct on (public.learn_fold(w)) w,
           (c.skill_id is not distinct from t.skill_id)::int as same_skill
    from t
    join concept_translations o
      on o.language_code = t.language_code and o.status = 'active'
     and o.tokens is not null and o.id <> t.id
    join concepts c on c.id = o.concept_id and c.status = 'active'
      and c.kind in ('sentence', 'phrase')
    cross join lateral unnest(o.tokens) w
    where not (public.learn_fold(w) = any (t.folds))
    order by public.learn_fold(w), random()
  )
  select coalesce(array_agg(w), '{}')
  from (select w from words order by same_skill desc, random() limit greatest(p_n, 0)) s;
$$;

-- ---------------------------------------------------------------------------
-- Exercise builders.
--
-- Each exercise is stored in full ({type, concept_ids, payload, answer,
-- solution}) and sent to the browser as {index, type, payload} only.
-- A builder returns null when the content cannot support that exercise
-- (too few distractors, no gap marked...), and the composer tries another.
-- ---------------------------------------------------------------------------

create or replace function public.learn_build_exercise(
  p_type text,
  p_concept_id bigint,
  p_target text,
  p_known text,
  p_pool bigint[] default '{}'
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  c concepts%rowtype;
  tt concept_translations%rowtype;
  kt concept_translations%rowtype;
  v_choices text[];
  v_payload jsonb;
  v_answer jsonb;
  v_solution text;
  v_concepts bigint[] := array[p_concept_id];
  v_credit jsonb;
  v_disp text[];
  v_tok text;
  v_pos int;
  v_before text;
  v_after text;
  v_true boolean;
  v_statement text;
  v_ids bigint[];
  v_left jsonb := '[]';
  v_right jsonb := '[]';
  v_pairs jsonb := '{}';
  v_seen_t text[] := '{}';
  v_seen_k text[] := '{}';
  r record;
  i int := 0;
begin
  select * into c from concepts where id = p_concept_id and status = 'active';
  select * into tt from concept_translations
    where concept_id = p_concept_id and language_code = p_target and status = 'active';
  select * into kt from concept_translations
    where concept_id = p_concept_id and language_code = p_known and status = 'active';
  if c.id is null or tt.id is null or kt.id is null then
    return null;
  end if;

  if not exists (select 1 from exercise_templates where key = p_type and is_active) then
    return null;
  end if;

  v_credit := public.learn_credit(tt.id);

  case p_type
  when 'vocab_choice' then
    v_choices := public.learn_word_distractors(c.id, p_known, 3, array[kt.text]);
    if cardinality(v_choices) < 2 then return null; end if;
    v_payload := jsonb_build_object(
      'prompt', tt.text, 'prompt_lang', p_target, 'speak', tt.text,
      'choices', public.learn_shuffle(to_jsonb(v_choices || kt.text)));
    v_answer := jsonb_build_object('choice', kt.text);
    v_solution := kt.text;

  when 'vocab_recall' then
    v_choices := public.learn_word_distractors(c.id, p_target, 3, array[tt.text]);
    if cardinality(v_choices) < 2 then return null; end if;
    v_payload := jsonb_build_object(
      'prompt', kt.text, 'prompt_lang', p_known,
      'choices', public.learn_shuffle(to_jsonb(v_choices || tt.text)));
    v_answer := jsonb_build_object('choice', tt.text);
    v_solution := tt.text;

  when 'type_translation' then
    if c.kind = 'sentence' then return null; end if;
    v_payload := jsonb_build_object('prompt', kt.text, 'prompt_lang', p_known);
    v_answer := jsonb_build_object('accept', to_jsonb(tt.text || tt.alternatives));
    v_solution := tt.text;

  when 'listen_choice' then
    if c.kind = 'word' then
      v_choices := public.learn_word_distractors(c.id, p_target, 3, array[tt.text]);
    else
      v_choices := public.learn_sentence_distractors(c.id, p_target, 3, array[tt.text]);
    end if;
    if cardinality(v_choices) < 2 then return null; end if;
    v_payload := jsonb_build_object(
      'speak', tt.text,
      'choices', public.learn_shuffle(to_jsonb(v_choices || tt.text)));
    v_answer := jsonb_build_object('choice', tt.text);
    v_solution := tt.text;

  when 'listen_type' then
    -- Dictation of a long sentence is a typing test, not a listening one.
    if tt.tokens is not null and cardinality(tt.tokens) > 7 then return null; end if;
    v_payload := jsonb_build_object('speak', tt.text);
    v_answer := jsonb_build_object('accept', to_jsonb(tt.text || tt.alternatives));
    v_solution := tt.text;

  when 'missing_word' then
    if tt.cloze_index is null then return null; end if;
    v_choices := public.learn_cloze_distractors(tt.id, 3);
    if cardinality(v_choices) < 2 then return null; end if;
    -- Display tokens keep their punctuation; tokens[] are the bare words the
    -- build script derived one-to-one from them.
    v_disp := regexp_split_to_array(btrim(tt.text), '\s+');
    if cardinality(v_disp) <> cardinality(tt.tokens) then return null; end if;
    v_tok := v_disp[tt.cloze_index + 1];
    v_pos := strpos(v_tok, tt.tokens[tt.cloze_index + 1]);
    if v_pos = 0 then return null; end if;
    v_before := btrim(array_to_string(v_disp[1:tt.cloze_index], ' ') || ' '
                || left(v_tok, v_pos - 1));
    v_after := btrim(substr(v_tok, v_pos + char_length(tt.tokens[tt.cloze_index + 1]))
               || ' ' || coalesce(array_to_string(v_disp[tt.cloze_index + 2:], ' '), ''));
    v_payload := jsonb_build_object(
      'before', v_before, 'after', v_after,
      'hint', kt.text, 'hint_lang', p_known,
      'choices', public.learn_shuffle(to_jsonb(v_choices || tt.tokens[tt.cloze_index + 1])));
    v_answer := jsonb_build_object('choice', tt.tokens[tt.cloze_index + 1]);
    v_solution := tt.text;

  when 'word_order', 'word_bank' then
    if tt.tokens is null or cardinality(tt.tokens) < 3 or cardinality(tt.tokens) > 12 then
      return null;
    end if;
    v_choices := tt.tokens;
    if p_type = 'word_bank' then
      v_choices := v_choices || public.learn_tile_decoys(tt.id, 3);
    end if;
    v_payload := jsonb_build_object(
      'hint', kt.text, 'hint_lang', p_known,
      'tiles', public.learn_shuffle(to_jsonb(v_choices)));
    v_answer := jsonb_build_object('accept', to_jsonb(tt.text || tt.alternatives));
    v_solution := tt.text;

  when 'sentence_choice' then
    v_choices := public.learn_sentence_distractors(c.id, p_known, 3, array[kt.text]);
    if cardinality(v_choices) < 2 then return null; end if;
    v_payload := jsonb_build_object(
      'prompt', tt.text, 'prompt_lang', p_target, 'speak', tt.text,
      'choices', public.learn_shuffle(to_jsonb(v_choices || kt.text)));
    v_answer := jsonb_build_object('choice', kt.text);
    v_solution := kt.text;

  when 'true_false' then
    v_true := random() < 0.5;
    if v_true then
      v_statement := kt.text;
    else
      v_statement := (public.learn_sentence_distractors(c.id, p_known, 1, array[kt.text]))[1];
      if v_statement is null then
        v_true := true;
        v_statement := kt.text;
      end if;
    end if;
    v_payload := jsonb_build_object(
      'prompt', tt.text, 'prompt_lang', p_target, 'speak', tt.text,
      'statement', v_statement, 'statement_lang', p_known);
    v_answer := jsonb_build_object('value', v_true);
    v_solution := kt.text;

  when 'context_choice' then
    if c.situation is null then return null; end if;
    v_choices := public.learn_sentence_distractors(c.id, p_target, 2, array[tt.text], false);
    if cardinality(v_choices) < 2 then return null; end if;
    v_payload := jsonb_build_object(
      'situation', c.situation,
      'choices', public.learn_shuffle(to_jsonb(v_choices || tt.text)));
    v_answer := jsonb_build_object('choice', tt.text);
    v_solution := tt.text;

  when 'match_pairs' then
    -- The concept itself plus up to three more from the pool, all distinct on
    -- both sides so no pair is ambiguous.
    for r in
      select x.id, ttx.text as t_text, ttx.folded as t_fold,
             ktx.text as k_text, ktx.folded as k_fold
      from (
        select p_concept_id as id, 0 as o
        union all
        select u.id, 1 + (random() * 1000)::int
        from unnest(p_pool) u(id)
        where u.id <> p_concept_id
      ) x
      join concepts cx on cx.id = x.id and cx.status = 'active' and cx.kind in ('word', 'phrase')
      join concept_translations ttx
        on ttx.concept_id = x.id and ttx.language_code = p_target and ttx.status = 'active'
      join concept_translations ktx
        on ktx.concept_id = x.id and ktx.language_code = p_known and ktx.status = 'active'
      order by x.o
    loop
      continue when r.t_fold = any (v_seen_t) or r.k_fold = any (v_seen_k);
      -- Near-synonyms in one exercise would make two pairings "right".
      continue when exists (
        select 1 from concepts a join concepts b on a.sense_group = b.sense_group
        where a.id = r.id and b.id = any (v_ids)
      );
      v_seen_t := v_seen_t || r.t_fold;
      v_seen_k := v_seen_k || r.k_fold;
      v_ids := coalesce(v_ids, '{}') || r.id;
      v_left := v_left || jsonb_build_object('id', 'l' || i, 'text', r.t_text);
      v_right := v_right || jsonb_build_object('id', 'r' || i, 'text', r.k_text);
      v_pairs := v_pairs || jsonb_build_object('l' || i, 'r' || i);
      i := i + 1;
      exit when i = 4;
    end loop;
    if i < 3 then return null; end if;
    -- Right-hand ids are re-keyed after shuffling so position gives nothing away.
    select jsonb_agg(jsonb_build_object('id', 'r' || (n - 1), 'text', e ->> 'text') order by n),
           jsonb_object_agg('o' || (n - 1), e ->> 'id')
      into v_right, v_answer
    from (select e, row_number() over (order by random()) as n
          from jsonb_array_elements(v_right) e) s;
    -- v_answer is now {new_right_id: old_right_id}; turn it into left -> new right.
    select jsonb_object_agg(l.key, (
             select 'r' || substr(o.key, 2)
             from jsonb_each_text(v_answer) o where o.value = l.value))
      into v_pairs
    from jsonb_each_text(v_pairs) l;
    v_payload := jsonb_build_object(
      'left', public.learn_shuffle(v_left), 'right', v_right,
      'left_lang', p_target, 'right_lang', p_known);
    v_answer := jsonb_build_object('pairs', v_pairs);
    v_concepts := v_ids;
    v_solution := null;

  else
    return null;
  end case;

  if v_credit is not null then
    v_payload := v_payload || jsonb_build_object('credit', v_credit);
  end if;

  return jsonb_build_object(
    'type', p_type,
    'concept_ids', to_jsonb(v_concepts),
    'payload', v_payload,
    'answer', v_answer,
    'solution', v_solution
  );
end;
$$;

-- "New words" card: up to four never-seen words, shown with their meaning
-- before the learner is tested on them. Ungraded.
create or replace function public.learn_build_new_words(
  p_concept_ids bigint[],
  p_target text,
  p_known text
)
returns jsonb
language sql
volatile
security definer
set search_path = public
as $$
  select case when count(*) = 0 then null else jsonb_build_object(
    'type', 'new_words',
    'concept_ids', to_jsonb(array_agg(c.id order by u.ord)),
    'payload', jsonb_build_object(
      'items', jsonb_agg(jsonb_build_object(
        'text', tt.text, 'translation', kt.text, 'speak', tt.text,
        'gender', tt.gender, 'note', tt.note
      ) order by u.ord),
      'lang', p_target, 'translation_lang', p_known),
    'answer', null,
    'solution', null
  ) end
  from unnest(p_concept_ids) with ordinality u(id, ord)
  join concepts c on c.id = u.id and c.status = 'active'
  join concept_translations tt
    on tt.concept_id = c.id and tt.language_code = p_target and tt.status = 'active'
  join concept_translations kt
    on kt.concept_id = c.id and kt.language_code = p_known and kt.status = 'active'
  where exists (select 1 from exercise_templates where key = 'new_words' and is_active);
$$;

-- ---------------------------------------------------------------------------
-- Lesson composition.
-- ---------------------------------------------------------------------------

-- Lessons in course order for one direction, with how many of their concepts
-- are playable (realised and active in both languages). Lessons whose content
-- is not there yet for a language simply drop out.
create or replace function public.learn_course_lessons(p_target text, p_known text)
returns table (
  lesson_id bigint,
  lesson_key text,
  lesson_title text,
  lesson_type text,
  lesson_position smallint,
  skill_id bigint,
  unit_id bigint,
  ord bigint,
  playable integer
)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.key, l.title, l.lesson_type, l.position, s.id, u.id,
         row_number() over (order by u.cefr_level, u.position, s.position, l.position, l.id),
         pc.n
  from units u
  join skills s on s.unit_id = u.id and s.is_active
    and (s.language_code is null or s.language_code = p_target)
  join lessons l on l.skill_id = s.id and l.is_active
    and (l.language_code is null or l.language_code = p_target)
  cross join lateral (
    select count(*)::int as n
    from lesson_concepts lc
    join concepts c on c.id = lc.concept_id and c.status = 'active'
    where lc.lesson_id = l.id
      and exists (select 1 from concept_translations t
                  where t.concept_id = c.id and t.language_code = p_target and t.status = 'active')
      and exists (select 1 from concept_translations k
                  where k.concept_id = c.id and k.language_code = p_known and k.status = 'active')
  ) pc
  where u.is_active
    and (u.language_code is null or u.language_code = p_target)
    and pc.n >= 4;
$$;

-- Picks, for each slot of a plan, the pool concept used least so far in this
-- session and asks the builder for that exercise; falls back to a simpler
-- mechanic when the content cannot support the planned one.
create or replace function public.learn_compose(
  p_plan text[],
  p_words bigint[],
  p_sentences bigint[],
  p_target text,
  p_known text,
  p_audio boolean,
  p_pair_pool bigint[]
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_out jsonb := '[]';
  v_used jsonb := '{}';      -- concept id -> times used
  v_pairs text[] := '{}';    -- "concept:type" already generated
  v_slot text;
  v_types text[];
  v_type text;
  v_pool bigint[];
  v_ex jsonb;
  v_cid bigint;
begin
  foreach v_slot in array p_plan loop
    v_types := case v_slot
      when 'listen_choice' then
        case when p_audio then array['listen_choice', 'vocab_choice'] else array['vocab_choice', 'vocab_recall'] end
      when 'listen_type' then
        case when p_audio then array['listen_type', 'type_translation'] else array['type_translation', 'vocab_recall'] end
      when 'context_choice' then array['context_choice', 'type_translation', 'vocab_recall']
      when 'missing_word' then array['missing_word', 'sentence_choice', 'vocab_choice']
      when 'word_order' then array['word_order', 'sentence_choice', 'vocab_recall']
      when 'word_bank' then array['word_bank', 'word_order', 'sentence_choice']
      when 'sentence_choice' then array['sentence_choice', 'true_false', 'vocab_choice']
      when 'true_false' then array['true_false', 'sentence_choice', 'vocab_choice']
      when 'match_pairs' then array['match_pairs', 'vocab_choice']
      when 'type_translation' then array['type_translation', 'vocab_recall']
      when 'vocab_recall' then array['vocab_recall', 'vocab_choice']
      else array['vocab_choice', 'vocab_recall']
    end;

    v_ex := null;
    foreach v_type in array v_types loop
      v_pool := case
        when v_type in ('vocab_choice', 'vocab_recall', 'type_translation', 'match_pairs') then p_words
        when v_type in ('listen_choice', 'listen_type', 'context_choice') then p_words || p_sentences
        else p_sentences
      end;
      continue when coalesce(cardinality(v_pool), 0) = 0;

      -- Only candidates whose content can carry this mechanic, least used
      -- first, so one lesson spreads over all its concepts.
      for v_cid in
        select u.id
        from unnest(v_pool) u(id)
        join concepts c on c.id = u.id
        join concept_translations tt
          on tt.concept_id = u.id and tt.language_code = p_target and tt.status = 'active'
        where not ((u.id::text || ':' || v_type) = any (v_pairs))
          and case v_type
                when 'context_choice' then c.situation is not null
                when 'missing_word' then tt.cloze_index is not null
                when 'word_order' then cardinality(tt.tokens) between 3 and 12
                when 'word_bank' then cardinality(tt.tokens) between 3 and 12
                when 'listen_type' then coalesce(cardinality(tt.tokens), 1) <= 7
                when 'type_translation' then c.kind <> 'sentence'
                else true
              end
        order by coalesce((v_used ->> u.id::text)::int, 0), random()
        limit 3
      loop
        v_ex := public.learn_build_exercise(v_type, v_cid, p_target, p_known, p_pair_pool);
        exit when v_ex is not null;
      end loop;
      exit when v_ex is not null;
    end loop;

    continue when v_ex is null;

    v_out := v_out || jsonb_build_array(v_ex);
    v_pairs := v_pairs || ((v_ex -> 'concept_ids' ->> 0) || ':' || (v_ex ->> 'type'));
    select v_used || coalesce(jsonb_object_agg(x, coalesce((v_used ->> x)::int, 0) + 1), '{}')
      into v_used
    from jsonb_array_elements_text(v_ex -> 'concept_ids') x;
  end loop;

  return v_out;
end;
$$;

-- What the browser gets: no answers, no concept ids.
create or replace function public.learn_strip_exercises(p_exercises jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'index', e.idx - 1,
    'type', e.ex ->> 'type',
    'payload', e.ex -> 'payload',
    'is_retry', (e.ex ? 'retry_of')
  ) order by e.idx), '[]'::jsonb)
  from jsonb_array_elements(p_exercises) with ordinality e(ex, idx);
$$;

create or replace function public.learn_session_payload(p_session_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'session_id', s.id,
    'mode', s.mode,
    'status', s.status,
    'lesson', case when l.id is null then null else jsonb_build_object(
      'id', l.id, 'title', l.title, 'lesson_type', l.lesson_type,
      'skill_title', sk.title, 'unit_title', u.title, 'cefr_level', u.cefr_level) end,
    'target', jsonb_build_object('code', tl.code, 'name', tl.name,
      'flag_emoji', tl.flag_emoji, 'speech_locale', tl.speech_locale),
    'known', jsonb_build_object('code', kl.code, 'name', kl.name,
      'flag_emoji', kl.flag_emoji, 'speech_locale', kl.speech_locale),
    'exercises', public.learn_strip_exercises(s.exercises),
    -- Already-answered results, so a refresh resumes where it left off.
    'results', s.results
  )
  from lesson_sessions s
  join languages tl on tl.code = s.language_code
  join languages kl on kl.code = s.known_language_code
  left join lessons l on l.id = s.lesson_id
  left join skills sk on sk.id = l.skill_id
  left join units u on u.id = sk.unit_id
  where s.id = p_session_id;
$$;

-- Resolves (target, known) for the caller or raises a friendly error.
create or replace function public.learn_directions(p_uid uuid, out target text, out known text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_native text;
begin
  select language_code into target
  from user_languages where user_id = p_uid and role = 'learning' limit 1;
  select language_code into v_native
  from user_languages where user_id = p_uid and role = 'native' limit 1;

  if target is null then
    raise exception 'No learning language set' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from courses where language_code = target and is_published) then
    raise exception 'There is no course for your learning language yet'
      using errcode = 'check_violation';
  end if;

  known := public.learn_known_language(v_native, target);
end;
$$;

-- ---------------------------------------------------------------------------
-- Client API: start a lesson or a review.
-- ---------------------------------------------------------------------------

create or replace function public.start_lesson(
  p_lesson_id bigint,
  p_audio boolean default true
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_dir record;
  v_lesson lessons%rowtype;
  v_scope bigint[];
  v_words bigint[];
  v_sentences bigint[];
  v_pair_pool bigint[];
  v_new bigint[];
  v_plan text[];
  v_exercises jsonb := '[]';
  v_intro jsonb;
  v_session_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_dir from public.learn_directions(v_uid);

  select l.* into v_lesson
  from public.learn_course_lessons(v_dir.target, v_dir.known) cl
  join lessons l on l.id = cl.lesson_id
  where cl.lesson_id = p_lesson_id;

  if v_lesson.id is null then
    raise exception 'That lesson is not available for your languages'
      using errcode = 'check_violation';
  end if;

  -- A practice lesson recombines everything its skill teaches.
  if v_lesson.lesson_type = 'practice' then
    v_scope := array(
      select distinct lc.concept_id from lessons l
      join lesson_concepts lc on lc.lesson_id = l.id
      where l.skill_id = v_lesson.skill_id and l.is_active);
  else
    v_scope := array(select concept_id from lesson_concepts
                     where lesson_id = v_lesson.id order by position);
  end if;

  -- Playable concepts, weakest first for practice (SRS box, then misses).
  select
    array_agg(c.id order by coalesce(p.box, 0), coalesce(p.incorrect_count, 0) desc, random())
      filter (where c.kind in ('word', 'phrase')),
    array_agg(c.id order by coalesce(p.box, 0), random())
      filter (where c.kind = 'sentence'
                 or (c.kind = 'phrase' and cardinality(tt.tokens) >= 3))
  into v_words, v_sentences
  from concepts c
  join concept_translations tt
    on tt.concept_id = c.id and tt.language_code = v_dir.target and tt.status = 'active'
  join concept_translations kt
    on kt.concept_id = c.id and kt.language_code = v_dir.known and kt.status = 'active'
  left join user_concept_progress p
    on p.user_id = v_uid and p.language_code = v_dir.target and p.concept_id = c.id
  where c.id = any (v_scope) and c.status = 'active';

  v_words := coalesce(v_words, '{}');
  v_sentences := coalesce(v_sentences, '{}');

  -- Matching needs four words; borrow from the rest of the skill if needed.
  v_pair_pool := v_words || array(
    select c.id from concepts c
    join concept_translations tt
      on tt.concept_id = c.id and tt.language_code = v_dir.target and tt.status = 'active'
    join concept_translations kt
      on kt.concept_id = c.id and kt.language_code = v_dir.known and kt.status = 'active'
    where c.skill_id = v_lesson.skill_id and c.status = 'active'
      and c.kind in ('word', 'phrase') and not (c.id = any (v_words))
    order by random() limit 6);

  if v_lesson.lesson_type = 'learn' then
    v_new := array(
      select u.id from unnest(v_words) with ordinality u(id, ord)
      where not exists (
        select 1 from user_concept_progress p
        where p.user_id = v_uid and p.language_code = v_dir.target and p.concept_id = u.id)
      order by u.ord limit 4);
    v_intro := public.learn_build_new_words(v_new, v_dir.target, v_dir.known);
    if v_intro is not null then
      v_exercises := jsonb_build_array(v_intro);
    end if;

    v_plan := array['vocab_choice', 'vocab_choice', 'match_pairs', 'missing_word',
                    'vocab_recall', 'sentence_choice', 'listen_choice', 'word_order',
                    'true_false', 'context_choice', 'listen_type', 'word_bank'];
  else
    v_plan := array['match_pairs', 'missing_word', 'sentence_choice', 'word_order',
                    'listen_type', 'vocab_recall', 'context_choice', 'missing_word',
                    'true_false', 'type_translation', 'listen_choice', 'word_bank'];
  end if;

  v_exercises := v_exercises || public.learn_compose(
    v_plan, v_words, v_sentences, v_dir.target, v_dir.known, p_audio, v_pair_pool);

  if jsonb_array_length(v_exercises) < 3 then
    raise exception 'Not enough content in this lesson yet' using errcode = 'check_violation';
  end if;

  -- One live session per learner keeps the table from filling with
  -- half-finished attempts; old abandoned ones are cleared on the way.
  update lesson_sessions set status = 'abandoned'
  where user_id = v_uid and status = 'in_progress';
  delete from lesson_sessions
  where user_id = v_uid and status = 'abandoned' and created_at < now() - interval '7 days';

  insert into lesson_sessions (user_id, mode, lesson_id, language_code, known_language_code, exercises)
  values (v_uid, 'lesson', v_lesson.id, v_dir.target, v_dir.known, v_exercises)
  returning id into v_session_id;

  return public.learn_session_payload(v_session_id);
end;
$$;

-- Review: due items first (oldest due, lowest box), topped up with the
-- learner's weakest items so "review" always has something useful in it.
create or replace function public.start_review(p_audio boolean default true)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_dir record;
  v_items record;
  v_exercises jsonb := '[]';
  v_words bigint[] := '{}';
  v_ex jsonb;
  v_types text[];
  v_type text;
  v_session_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_dir from public.learn_directions(v_uid);

  for v_items in
    select p.concept_id, p.box, c.kind, (p.next_review_at <= now()) as due
    from user_concept_progress p
    join concepts c on c.id = p.concept_id and c.status = 'active'
    where p.user_id = v_uid and p.language_code = v_dir.target
      and exists (select 1 from concept_translations t where t.concept_id = c.id
                  and t.language_code = v_dir.target and t.status = 'active')
      and exists (select 1 from concept_translations k where k.concept_id = c.id
                  and k.language_code = v_dir.known and k.status = 'active')
    order by (p.next_review_at <= now()) desc, p.next_review_at, p.box,
             p.incorrect_count desc
    limit 10
  loop
    -- Harder mechanics as an item climbs the boxes: recognise, then recall,
    -- then produce.
    v_types := case
      when v_items.kind = 'sentence' then
        case when v_items.box <= 1 then array['sentence_choice', 'missing_word']
             when v_items.box <= 3 then array['word_order', 'missing_word']
             else array['word_bank', 'listen_type'] end
      else
        case when v_items.box <= 1 then array['vocab_choice', 'listen_choice']
             when v_items.box <= 3 then array['vocab_recall', 'type_translation']
             else array['type_translation', 'listen_type'] end
    end;
    if not p_audio then
      v_types := array_remove(array_remove(v_types, 'listen_choice'), 'listen_type');
    end if;

    v_ex := null;
    foreach v_type in array (
      select array_agg(t order by random()) from unnest(v_types) t
    ) || array['vocab_choice', 'sentence_choice'] loop
      v_ex := public.learn_build_exercise(v_type, v_items.concept_id, v_dir.target, v_dir.known);
      exit when v_ex is not null;
    end loop;

    if v_ex is not null then
      v_exercises := v_exercises || jsonb_build_array(v_ex);
    end if;
    if v_items.kind in ('word', 'phrase') then
      v_words := v_words || v_items.concept_id;
    end if;
  end loop;

  if jsonb_array_length(v_exercises) < 3 then
    raise exception 'Nothing to review yet — finish a lesson first'
      using errcode = 'check_violation';
  end if;

  if cardinality(v_words) >= 4 then
    v_ex := public.learn_build_exercise('match_pairs', v_words[1], v_dir.target, v_dir.known, v_words);
    if v_ex is not null then
      v_exercises := jsonb_insert(v_exercises, '{1}', v_ex);
    end if;
  end if;

  update lesson_sessions set status = 'abandoned'
  where user_id = v_uid and status = 'in_progress';
  delete from lesson_sessions
  where user_id = v_uid and status = 'abandoned' and created_at < now() - interval '7 days';

  insert into lesson_sessions (user_id, mode, language_code, known_language_code, exercises)
  values (v_uid, 'review', v_dir.target, v_dir.known, v_exercises)
  returning id into v_session_id;

  return public.learn_session_payload(v_session_id);
end;
$$;

create or replace function public.get_lesson_session(p_session_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from lesson_sessions where id = p_session_id and user_id = v_uid) then
    return null;
  end if;
  return public.learn_session_payload(p_session_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grading and spaced repetition.
-- ---------------------------------------------------------------------------

-- Pure grading of one answer against one stored exercise.
-- Returns {correct, note, per_concept: {concept_id: bool}}.
create or replace function public.learn_grade(p_ex jsonb, p_answer jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_type text := p_ex ->> 'type';
  v_correct boolean := false;
  v_note text;
  v_given text;
  v_per jsonb := '{}';
  v_key text;
  v_all boolean := true;
  v_i int := 0;
begin
  if v_type in ('vocab_choice', 'vocab_recall', 'listen_choice', 'missing_word',
                'sentence_choice', 'context_choice') then
    v_correct := (p_answer ->> 'choice') is not distinct from (p_ex -> 'answer' ->> 'choice');

  elsif v_type = 'true_false' then
    v_correct := (p_answer ->> 'value')::boolean is not distinct from (p_ex -> 'answer' ->> 'value')::boolean;

  elsif v_type in ('type_translation', 'listen_type', 'word_order', 'word_bank') then
    if v_type in ('word_order', 'word_bank') then
      select string_agg(x, ' ' order by o) into v_given
      from jsonb_array_elements_text(coalesce(p_answer -> 'tokens', '[]')) with ordinality t(x, o);
    else
      v_given := p_answer ->> 'text';
    end if;
    v_given := left(coalesce(v_given, ''), 300);

    if exists (select 1 from jsonb_array_elements_text(p_ex -> 'answer' -> 'accept') a
               where public.learn_norm(a) = public.learn_norm(v_given)) then
      v_correct := true;
    elsif public.learn_fold(v_given) <> '' and exists (
      select 1 from jsonb_array_elements_text(p_ex -> 'answer' -> 'accept') a
      where public.learn_fold(a) = public.learn_fold(v_given)) then
      v_correct := true;
      v_note := 'accents';
    end if;

  elsif v_type = 'match_pairs' then
    for v_key in select jsonb_object_keys(p_ex -> 'answer' -> 'pairs') loop
      v_per := v_per || jsonb_build_object(
        (p_ex -> 'concept_ids' ->> v_i),
        (p_answer -> 'pairs' ->> v_key) is not distinct from (p_ex -> 'answer' -> 'pairs' ->> v_key));
      v_all := v_all and ((p_answer -> 'pairs' ->> v_key) is not distinct from (p_ex -> 'answer' -> 'pairs' ->> v_key));
      v_i := v_i + 1;
    end loop;
    return jsonb_build_object('correct', v_all, 'note', null, 'per_concept', v_per);
  end if;

  select coalesce(jsonb_object_agg(c, v_correct), '{}') into v_per
  from jsonb_array_elements_text(p_ex -> 'concept_ids') c;

  return jsonb_build_object('correct', v_correct, 'note', v_note, 'per_concept', v_per);
end;
$$;

-- Leitner update for one observation.
--   wrong  -> drop two boxes, back in the queue in ten minutes
--   right, and the item was due (or new) -> up one box, interval grows
--   right, but not due yet -> counted, no promotion (cramming earns nothing)
create or replace function public.learn_record_result(
  p_uid uuid,
  p_lang text,
  p_concept_id bigint,
  p_correct boolean
)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  insert into user_concept_progress as p (
    user_id, language_code, concept_id, box, times_seen, correct_count,
    incorrect_count, streak, last_result, last_seen_at, next_review_at)
  values (
    p_uid, p_lang, p_concept_id,
    case when p_correct then 1 else 0 end,
    1, p_correct::int, (not p_correct)::int, p_correct::int, p_correct, now(),
    now() + public.learn_box_interval((case when p_correct then 1 else 0 end)::smallint))
  on conflict (user_id, language_code, concept_id) do update set
    box = case
      when not p_correct then greatest(p.box - 2, 0)
      when p.next_review_at <= now() then least(p.box + 1, 5)
      else p.box end,
    next_review_at = case
      when not p_correct then now() + interval '10 minutes'
      when p.next_review_at <= now() then now() + public.learn_box_interval(least(p.box + 1, 5)::smallint)
      else p.next_review_at end,
    times_seen = p.times_seen + 1,
    correct_count = p.correct_count + p_correct::int,
    incorrect_count = p.incorrect_count + (not p_correct)::int,
    streak = case when p_correct then least(p.streak + 1, 1000) else 0 end,
    last_result = p_correct,
    last_seen_at = now();
$$;

-- The client submits what the learner did, never whether it was right.
create or replace function public.answer_lesson_exercise(
  p_session_id uuid,
  p_index int,
  p_answer jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s lesson_sessions%rowtype;
  v_ex jsonb;
  v_grade jsonb;
  v_result jsonb;
  v_retry jsonb;
  v_retries int;
  v_appended jsonb := null;
  v_pc record;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_s from lesson_sessions where id = p_session_id for update;
  if v_s.id is null or v_s.user_id <> v_uid then
    raise exception 'Session not found' using errcode = '42501';
  end if;
  if v_s.status <> 'in_progress' then
    raise exception 'This lesson is already over' using errcode = 'check_violation';
  end if;

  -- Bounds first: jsonb `-> -1` counts from the end, which would let one
  -- exercise be answered under a second key to read its answer.
  if p_index is null or p_index < 0 or p_index >= jsonb_array_length(v_s.exercises) then
    raise exception 'No such exercise' using errcode = 'check_violation';
  end if;
  v_ex := v_s.exercises -> p_index;

  -- Idempotent: a double tap or a retried request gets the first verdict,
  -- including the retry it queued (the client may never have seen it).
  if v_s.results ? p_index::text then
    v_result := v_s.results -> p_index::text;
    return v_result || jsonb_build_object('appended', case
      when v_result ? 'appended_index' then jsonb_build_object(
        'index', (v_result ->> 'appended_index')::int,
        'type', v_s.exercises -> (v_result ->> 'appended_index')::int ->> 'type',
        'payload', v_s.exercises -> (v_result ->> 'appended_index')::int -> 'payload',
        'is_retry', true)
    end);
  end if;

  if v_ex ->> 'type' = 'new_words' then
    v_result := jsonb_build_object('correct', null, 'note', null, 'solution', null, 'graded', false);
  elsif v_ex ->> 'type' in ('listen_choice', 'listen_type') and coalesce((p_answer ->> 'skip')::boolean, false) then
    -- "Can't listen now": no voice on this device, or no headphones. Shown
    -- the answer, not scored, SRS untouched.
    v_result := jsonb_build_object('correct', null, 'note', 'skipped',
      'solution', v_ex ->> 'solution', 'expected', v_ex -> 'answer', 'graded', false);
  else
    v_grade := public.learn_grade(v_ex, p_answer);

    for v_pc in select key::bigint as concept_id, value::boolean as ok
                from jsonb_each_text(v_grade -> 'per_concept') loop
      perform public.learn_record_result(v_uid, v_s.language_code, v_pc.concept_id, v_pc.ok);
    end loop;

    -- Once the learner has committed, the key is theirs to see: the right
    -- option is highlighted, the right pairs are shown.
    v_result := jsonb_build_object(
      'correct', (v_grade ->> 'correct')::boolean,
      'note', v_grade ->> 'note',
      'solution', v_ex ->> 'solution',
      'expected', v_ex -> 'answer',
      'graded', true);

    -- A miss comes back once at the end of the lesson (at most three times
    -- per session), with its options reshuffled.
    select count(*) into v_retries
    from jsonb_array_elements(v_s.exercises) e where e ? 'retry_of';
    if not (v_grade ->> 'correct')::boolean and not (v_ex ? 'retry_of') and v_retries < 3 then
      v_retry := v_ex || jsonb_build_object('retry_of', p_index);
      if v_retry -> 'payload' ? 'choices' then
        v_retry := jsonb_set(v_retry, '{payload,choices}', public.learn_shuffle(v_retry -> 'payload' -> 'choices'));
      end if;
      if v_retry -> 'payload' ? 'tiles' then
        v_retry := jsonb_set(v_retry, '{payload,tiles}', public.learn_shuffle(v_retry -> 'payload' -> 'tiles'));
      end if;
      v_s.exercises := v_s.exercises || jsonb_build_array(v_retry);
      v_appended := jsonb_build_object(
        'index', jsonb_array_length(v_s.exercises) - 1,
        'type', v_retry ->> 'type',
        'payload', v_retry -> 'payload',
        'is_retry', true);
      v_result := v_result || jsonb_build_object('appended_index', jsonb_array_length(v_s.exercises) - 1);
    end if;
  end if;

  update lesson_sessions
  set results = results || jsonb_build_object(p_index::text, v_result),
      exercises = v_s.exercises
  where id = p_session_id;

  return v_result || jsonb_build_object('appended', v_appended);
end;
$$;

-- Finishing is where XP happens. Scoring counts first attempts only; the
-- retries at the end are for learning, not for points.
--   lesson, first time completed: 15 XP     replay: 5 XP
--   review: 10 XP                            no mistakes at all: +5 XP
create or replace function public.complete_lesson_session(p_session_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s lesson_sessions%rowtype;
  v_total int;
  v_graded int := 0;
  v_first_right int := 0;
  v_any_wrong boolean := false;
  v_score smallint;
  v_first_time boolean := false;
  v_xp smallint;
  v_perfect boolean;
  v_earns boolean;
  v_phrase jsonb;
  v_next jsonb;
  v_skill bigint;
  e record;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_s from lesson_sessions where id = p_session_id for update;
  if v_s.id is null or v_s.user_id <> v_uid then
    raise exception 'Session not found' using errcode = '42501';
  end if;
  if v_s.status = 'completed' then
    return jsonb_build_object('already_completed', true, 'xp_awarded', 0, 'score', v_s.score);
  end if;
  if v_s.status <> 'in_progress' then
    raise exception 'This lesson was abandoned' using errcode = 'check_violation';
  end if;

  v_total := jsonb_array_length(v_s.exercises);
  for e in
    select (idx - 1)::int as i, ex from jsonb_array_elements(v_s.exercises) with ordinality t(ex, idx)
  loop
    if not (v_s.results ? e.i::text) then
      raise exception 'Answer every exercise first' using errcode = 'check_violation';
    end if;
    continue when e.ex ->> 'type' = 'new_words';
    continue when (v_s.results -> e.i::text ->> 'graded')::boolean is false;
    if (v_s.results -> e.i::text ->> 'correct')::boolean is false then
      v_any_wrong := true;
    end if;
    continue when e.ex ? 'retry_of';
    v_graded := v_graded + 1;
    if (v_s.results -> e.i::text ->> 'correct')::boolean then
      v_first_right := v_first_right + 1;
    end if;
  end loop;

  v_score := case when v_graded = 0 then 100 else round(100.0 * v_first_right / v_graded) end;
  v_perfect := not v_any_wrong and v_graded > 0;
  -- XP rewards learning, not clicking through: a session with fewer than half
  -- of its first attempts right still counts as practice (progress, SRS) but
  -- earns nothing, so replays and reviews cannot be farmed by guessing.
  v_earns := v_graded > 0 and v_score >= 50;

  if v_s.mode = 'lesson' then
    v_first_time := not exists (
      select 1 from user_lesson_progress
      where user_id = v_uid and language_code = v_s.language_code
        and lesson_id = v_s.lesson_id and times_completed > 0);
    v_xp := case when v_earns
      then (case when v_first_time then 15 else 5 end) + (case when v_perfect then 5 else 0 end)
      else 0 end;

    insert into user_lesson_progress as p (
      user_id, language_code, lesson_id, times_completed, best_score, last_score,
      first_completed_at, last_completed_at)
    values (v_uid, v_s.language_code, v_s.lesson_id, 1, v_score, v_score, now(), now())
    on conflict (user_id, language_code, lesson_id) do update set
      times_completed = p.times_completed + 1,
      best_score = greatest(p.best_score, excluded.best_score),
      last_score = excluded.last_score,
      last_completed_at = now();
  else
    v_xp := case when v_earns then 10 + (case when v_perfect then 5 else 0 end) else 0 end;
  end if;

  update lesson_sessions
  set status = 'completed', completed_at = now(), xp_awarded = v_xp, score = v_score
  where id = p_session_id;

  -- grant_xp ignores zero, so a sub-50 % session leaves the ledger alone.
  perform public.grant_xp(
    v_uid, v_xp,
    (case when v_s.mode = 'lesson' then 'lesson_completed' else 'review_completed' end)::xp_reason,
    'lesson_sessions', p_session_id::text);

  -- "Use it" phrase: something from this lesson (or its skill) worth asking a
  -- real person, in the language they are learning.
  if v_s.lesson_id is not null then
    select l.skill_id into v_skill from lessons l where l.id = v_s.lesson_id;

    select jsonb_build_object(
             'concept_id', c.id, 'text', tt.text, 'translation', kt.text,
             'situation', c.situation)
      into v_phrase
    from concepts c
    join concept_translations tt
      on tt.concept_id = c.id and tt.language_code = v_s.language_code and tt.status = 'active'
    join concept_translations kt
      on kt.concept_id = c.id and kt.language_code = v_s.known_language_code and kt.status = 'active'
    where c.is_social and c.status = 'active'
      and (c.id in (select concept_id from lesson_concepts where lesson_id = v_s.lesson_id)
           or c.skill_id = v_skill)
    order by (c.id in (select concept_id from lesson_concepts where lesson_id = v_s.lesson_id)) desc,
             random()
    limit 1;

    with cl as materialized (
      select * from public.learn_course_lessons(v_s.language_code, v_s.known_language_code)
    )
    select jsonb_build_object('id', cl.lesson_id, 'title', cl.lesson_title)
      into v_next
    from cl
    where cl.ord > coalesce((select c2.ord from cl c2 where c2.lesson_id = v_s.lesson_id), 0)
      and not exists (select 1 from user_lesson_progress p
                      where p.user_id = v_uid and p.language_code = v_s.language_code
                        and p.lesson_id = cl.lesson_id)
    order by cl.ord
    limit 1;
  end if;

  return jsonb_build_object(
    'already_completed', false,
    'xp_awarded', v_xp,
    'score', v_score,
    'perfect', v_perfect,
    'first_completion', v_first_time,
    'correct', v_first_right,
    'graded', v_graded,
    'social_phrase', v_phrase,
    'next_lesson', v_next,
    'review_due', (
      select count(*) from user_concept_progress
      where user_id = v_uid and language_code = v_s.language_code
        and next_review_at <= now())
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Course overview: one round trip for the whole Learn screen.
-- ---------------------------------------------------------------------------

create or replace function public.get_learn_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_target text;
  v_native text;
  v_known text;
  v_level cefr_level;
  v_units jsonb;
  v_next jsonb;
  v_srs jsonb;
  v_lessons jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select language_code, cefr_level into v_target, v_level
  from user_languages where user_id = v_uid and role = 'learning' limit 1;
  select language_code into v_native
  from user_languages where user_id = v_uid and role = 'native' limit 1;

  if v_target is null
     or not exists (select 1 from courses where language_code = v_target and is_published) then
    return jsonb_build_object('course', null, 'target_code', v_target);
  end if;

  v_known := public.learn_known_language(v_native, v_target);

  -- The course's lesson list is computed once and held as a value (no temp
  -- table: that would be catalog DDL on every Learn-tab load).
  select coalesce(jsonb_agg(to_jsonb(cl)), '[]'::jsonb) into v_lessons
  from public.learn_course_lessons(v_target, v_known) cl;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', u.id, 'key', u.key, 'cefr_level', u.cefr_level, 'title', u.title,
    'description', u.description,
    'skills', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'key', s.key, 'title', s.title, 'description', s.description,
        'icon', s.icon,
        'mastery', (
          select coalesce(round(avg(coalesce(p.box, 0)) * 20), 0)
          from concepts c
          left join user_concept_progress p
            on p.user_id = v_uid and p.language_code = v_target and p.concept_id = c.id
          where c.skill_id = s.id and c.status = 'active'),
        'lessons', (
          select jsonb_agg(jsonb_build_object(
            'id', ol.lesson_id, 'title', ol.lesson_title, 'lesson_type', ol.lesson_type,
            'completed', coalesce(ulp.times_completed, 0) > 0,
            'best_score', ulp.best_score
          ) order by ol.ord)
          from jsonb_to_recordset(v_lessons) as ol(lesson_id bigint, lesson_title text, lesson_type text, skill_id bigint, unit_id bigint, ord bigint)
          left join user_lesson_progress ulp
            on ulp.user_id = v_uid and ulp.language_code = v_target and ulp.lesson_id = ol.lesson_id
          where ol.skill_id = s.id)
      ) order by s.position), '[]'::jsonb)
      from skills s
      where s.unit_id = u.id
        and exists (select 1 from jsonb_to_recordset(v_lessons) as ol(lesson_id bigint, lesson_title text, lesson_type text, skill_id bigint, unit_id bigint, ord bigint) where ol.skill_id = s.id))
  ) order by u.cefr_level, u.position), '[]'::jsonb)
  into v_units
  from units u
  where exists (select 1 from jsonb_to_recordset(v_lessons) as ol(lesson_id bigint, lesson_title text, lesson_type text, skill_id bigint, unit_id bigint, ord bigint) where ol.unit_id = u.id);

  -- Next up: the first lesson not completed yet, in course order. A learner
  -- who said they are A2 starts at the first A2 unit they have not finished.
  select jsonb_build_object(
           'id', ol.lesson_id, 'title', ol.lesson_title, 'lesson_type', ol.lesson_type,
           'skill_title', s.title, 'unit_title', u.title, 'cefr_level', u.cefr_level)
    into v_next
  from jsonb_to_recordset(v_lessons) as ol(lesson_id bigint, lesson_title text, lesson_type text, skill_id bigint, unit_id bigint, ord bigint)
  join skills s on s.id = ol.skill_id
  join units u on u.id = ol.unit_id
  where not exists (
    select 1 from user_lesson_progress p
    where p.user_id = v_uid and p.language_code = v_target and p.lesson_id = ol.lesson_id)
  order by (u.cefr_level >= least(v_level, 'A2'::cefr_level)) desc, ol.ord
  limit 1;

  select jsonb_build_object(
    'due', count(*) filter (where p.next_review_at <= now()),
    'learned', count(*) filter (where p.box >= 1),
    'mastered', count(*) filter (where p.box >= 4),
    'seen', count(*),
    'next_due_at', min(p.next_review_at) filter (where p.next_review_at > now())
  )
  into v_srs
  from user_concept_progress p
  join concepts c on c.id = p.concept_id and c.status = 'active'
  where p.user_id = v_uid and p.language_code = v_target;

  return jsonb_build_object(
    'course', jsonb_build_object(
      'target', (select jsonb_build_object('code', code, 'name', name, 'native_name', native_name,
                   'flag_emoji', flag_emoji, 'speech_locale', speech_locale)
                 from languages where code = v_target),
      'known', (select jsonb_build_object('code', code, 'name', name, 'native_name', native_name,
                  'flag_emoji', flag_emoji, 'speech_locale', speech_locale)
                from languages where code = v_known),
      'level', v_level,
      'title', (select title from courses where language_code = v_target),
      'lessons_total', jsonb_array_length(v_lessons),
      'lessons_completed', (
        select count(*) from user_lesson_progress p
        join jsonb_to_recordset(v_lessons) as ol(lesson_id bigint, lesson_title text, lesson_type text, skill_id bigint, unit_id bigint, ord bigint) on ol.lesson_id = p.lesson_id
        where p.user_id = v_uid and p.language_code = v_target and p.times_completed > 0)),
    'review', v_srs,
    'next_lesson', v_next,
    'units', v_units
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Social: take a learned phrase into a real conversation.
-- ---------------------------------------------------------------------------

-- Records the intent and returns the text to prefill. Nothing is sent: the
-- learner edits and sends it themselves from the normal chat composer.
create or replace function public.share_phrase_with_match(
  p_match_id uuid,
  p_concept_id bigint
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_target text;
  v_text text;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from matches
    where id = p_match_id and status = 'active' and v_uid in (user_a, user_b)
  ) then
    raise exception 'Not a member of this match' using errcode = '42501';
  end if;

  select language_code into v_target
  from user_languages where user_id = v_uid and role = 'learning' limit 1;

  select ct.text into v_text
  from concepts c
  join concept_translations ct
    on ct.concept_id = c.id and ct.language_code = v_target and ct.status = 'active'
  where c.id = p_concept_id and c.status = 'active' and c.is_social;

  if v_text is null then
    raise exception 'That phrase is not available' using errcode = 'check_violation';
  end if;

  -- Re-sharing the same phrase with the same person reuses the pending row,
  -- as long as it is still inside the 14 days the message trigger honours.
  select id into v_id from phrase_shares
  where user_id = v_uid and match_id = p_match_id and concept_id = p_concept_id
    and used_at is null and created_at > now() - interval '14 days'
  order by created_at desc
  limit 1;

  if v_id is null then
    insert into phrase_shares (user_id, match_id, concept_id, language_code, text)
    values (v_uid, p_match_id, p_concept_id, v_target, v_text)
    returning id into v_id;
  end if;

  return jsonb_build_object('share_id', v_id, 'text', v_text, 'match_id', p_match_id);
end;
$$;

-- When a message containing a shared phrase is actually sent, the phrase
-- counts as used: +10 XP, at most three times a day. This is the one XP
-- source outside lessons, and it only fires on a real message to a real match.
create or replace function public.learn_on_message_sent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share record;
  v_today_count int;
begin
  -- Cheap exit for the overwhelmingly common case (partial index).
  if not exists (
    select 1 from phrase_shares
    where user_id = new.sender_id and match_id = new.match_id and used_at is null
      and created_at > now() - interval '14 days'
  ) then
    return null;
  end if;

  for v_share in
    select id from phrase_shares
    where user_id = new.sender_id and match_id = new.match_id and used_at is null
      and created_at > now() - interval '14 days'
      and strpos(public.learn_fold(new.body), public.learn_fold(text)) > 0
    for update
  loop
    update phrase_shares set used_at = now(), used_message_id = new.id
    where id = v_share.id;

    select count(*) into v_today_count
    from xp_events
    where user_id = new.sender_id and reason = 'phrase_used_in_chat'
      and created_at >= date_trunc('day', now() at time zone 'utc');

    if v_today_count < 3 then
      perform public.grant_xp(new.sender_id, 10::smallint, 'phrase_used_in_chat',
                              'phrase_shares', v_share.id::text);
    end if;
  end loop;

  return null;
end;
$$;

create trigger messages_learn_phrase_used
  after insert on messages
  for each row execute function public.learn_on_message_sent();

-- ---------------------------------------------------------------------------
-- Reporting a content problem from inside a lesson.
-- ---------------------------------------------------------------------------

create or replace function public.flag_lesson_content(
  p_session_id uuid,
  p_index int,
  p_reason text,
  p_note text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_s lesson_sessions%rowtype;
  v_cid bigint;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_s from lesson_sessions where id = p_session_id and user_id = v_uid;
  if v_s.id is null then
    raise exception 'Session not found' using errcode = '42501';
  end if;

  -- Concept ids stay server-side; the learner only names the exercise.
  for v_cid in
    select x::bigint from jsonb_array_elements_text(v_s.exercises -> p_index -> 'concept_ids') x
  loop
    -- One open report per learner per concept is plenty.
    continue when exists (
      select 1 from content_flags
      where concept_id = v_cid and reporter_id = v_uid and status = 'open');
    insert into content_flags (concept_id, language_code, reason, note, reporter_id, origin)
    values (v_cid, v_s.language_code, p_reason, left(p_note, 500), v_uid, 'user');
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Licenses & Attributions. Public, so the page works signed out.
-- ---------------------------------------------------------------------------

create or replace function public.get_content_attributions()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'source_type', s.source_type,
    'source_url', s.source_url,
    'license', s.license,
    'license_url', s.license_url,
    'author', s.author,
    'attribution_text', s.attribution_text,
    'requires_item_attribution', s.requires_item_attribution,
    'item_counts', (
      select coalesce(jsonb_object_agg(x.language_code, x.n), '{}')
      from (select language_code, count(*) as n from concept_translations
            where source_id = s.id and status = 'active' group by language_code) x),
    'contributors', case when s.requires_item_attribution then (
      select coalesce(jsonb_agg(a.source_author order by a.n desc, a.source_author), '[]')
      from (select source_author, count(*) as n from concept_translations
            where source_id = s.id and status = 'active' and source_author is not null
            group by source_author limit 500) a) end
  ) order by case s.source_type when 'editorial' then 0 when 'reference_data' then 1 else 2 end,
             s.name), '[]'::jsonb)
  from content_sources s
  where s.is_enabled;
$$;

-- ---------------------------------------------------------------------------
-- Grants. Postgres gives EXECUTE to PUBLIC by default and Supabase adds anon
-- and authenticated, so internal helpers are revoked explicitly: they would
-- otherwise hand answer keys to anyone who called them directly.
-- ---------------------------------------------------------------------------

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.learn_shuffle(jsonb)',
    'public.learn_known_language(text, text)',
    'public.learn_credit(bigint)',
    'public.learn_word_distractors(bigint, text, int, text[])',
    'public.learn_sentence_distractors(bigint, text, int, text[], boolean)',
    'public.learn_cloze_distractors(bigint, int)',
    'public.learn_tile_decoys(bigint, int)',
    'public.learn_build_exercise(text, bigint, text, text, bigint[])',
    'public.learn_build_new_words(bigint[], text, text)',
    'public.learn_course_lessons(text, text)',
    'public.learn_compose(text[], bigint[], bigint[], text, text, boolean, bigint[])',
    'public.learn_strip_exercises(jsonb)',
    'public.learn_session_payload(uuid)',
    'public.learn_directions(uuid)',
    'public.learn_grade(jsonb, jsonb)',
    'public.learn_record_result(uuid, text, bigint, boolean)',
    'public.learn_on_message_sent()'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end;
$$;

grant execute on function public.start_lesson(bigint, boolean) to authenticated;
grant execute on function public.start_review(boolean) to authenticated;
grant execute on function public.get_lesson_session(uuid) to authenticated;
grant execute on function public.answer_lesson_exercise(uuid, int, jsonb) to authenticated;
grant execute on function public.complete_lesson_session(uuid) to authenticated;
grant execute on function public.get_learn_overview() to authenticated;
grant execute on function public.share_phrase_with_match(uuid, bigint) to authenticated;
grant execute on function public.flag_lesson_content(uuid, int, text, text) to authenticated;
grant execute on function public.get_content_attributions() to anon, authenticated;

revoke execute on function public.start_lesson(bigint, boolean) from public, anon;
revoke execute on function public.start_review(boolean) from public, anon;
revoke execute on function public.get_lesson_session(uuid) from public, anon;
revoke execute on function public.answer_lesson_exercise(uuid, int, jsonb) from public, anon;
revoke execute on function public.complete_lesson_session(uuid) from public, anon;
revoke execute on function public.get_learn_overview() from public, anon;
revoke execute on function public.share_phrase_with_match(uuid, bigint) from public, anon;
revoke execute on function public.flag_lesson_content(uuid, int, text, text) from public, anon;
