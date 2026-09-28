-- 99995_learn_query_performance.sql
-- Makes lesson generation several times cheaper without changing what it
-- produces.
--
-- Profiling start_lesson() at ~1,100 concepts per language (about 940 ms) showed
-- the time was not in scanning the candidate pool -- that is ~1,100 indexed rows
-- -- but in re-running learn_fold(), a regex-heavy normaliser, over that pool on
-- every call: ~180,000 evaluations per lesson. The worst offenders were the
-- word-bank decoys (rebuilding the answer's folded tokens once per candidate
-- token) and the gap distractors. Folding is a pure function of stored text, so
-- it is stored too, exactly as concept_translations.folded already is.
--
-- No behaviour changes: every function below returns the same candidates as
-- before, ranked by the same scores.

-- ---------------------------------------------------------------------------
-- Folded tokens, stored.
-- ---------------------------------------------------------------------------

create or replace function public.learn_fold_tokens(p text[])
returns text[]
language sql
immutable
parallel safe
set search_path = public
as $$
  select case when p is null then null
              else array(select public.learn_fold(x)
                         from unnest(p) with ordinality u(x, n)
                         order by n)
         end;
$$;

-- tokens[i] and folded_tokens[i] always describe the same word.
alter table concept_translations
  add column if not exists folded_tokens text[]
    generated always as (public.learn_fold_tokens(tokens)) stored;

-- ---------------------------------------------------------------------------
-- Word and sentence distractors: fold the exclude list once, not once per row.
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
  with ex as materialized (
    select coalesce(array_agg(public.learn_fold(x)), '{}') as folds
    from unnest(p_exclude) x
  ),
  t as (select * from concepts where id = p_concept_id),
  cand as (
    select distinct on (ct.folded)
      ct.text,
      (c.part_of_speech is not distinct from t.part_of_speech)::int * 8
        + (c.topic = t.topic)::int * 4
        + (c.skill_id is not distinct from t.skill_id)::int * 2
        + (c.cefr_level <= t.cefr_level)::int as score,
      random() as r
    from t
    cross join ex
    join concepts c
      on c.kind = t.kind and c.id <> t.id and c.status = 'active'
     and (t.sense_group is null or c.sense_group is distinct from t.sense_group)
    join concept_translations ct
      on ct.concept_id = c.id and ct.language_code = p_lang and ct.status = 'active'
    where ct.folded <> all (ex.folds)
    order by ct.folded, score desc, r
  )
  select coalesce(array_agg(text order by score desc, r), '{}')
  from (select * from cand order by score desc, r limit greatest(p_n, 0)) s;
$$;

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
  with ex as materialized (
    select coalesce(array_agg(public.learn_fold(x)), '{}') as folds
    from unnest(p_exclude) x
  ),
  t as (
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
    cross join ex
    join concepts c
      on c.kind in ('sentence', 'phrase') and c.id <> t.id and c.status = 'active'
     and (t.sense_group is null or c.sense_group is distinct from t.sense_group)
    left join skills sk on sk.id = c.skill_id
    join concept_translations ct
      on ct.concept_id = c.id and ct.language_code = p_lang and ct.status = 'active'
    where ct.folded <> all (ex.folds)
      and (c.kind = 'sentence' or cardinality(ct.tokens) >= 2)
    order by ct.folded, score desc, r
  )
  select coalesce(array_agg(text order by score desc, r), '{}')
  from (select * from cand order by score desc, r limit greatest(p_n, 0)) s;
$$;

-- ---------------------------------------------------------------------------
-- Gap distractors: read the stored folds instead of folding every candidate
-- (several times each) inside the query.
-- ---------------------------------------------------------------------------

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
  with t as materialized (
    select ct.language_code, ct.cloze_index, ct.cloze_pos, ct.id,
           c.skill_id, c.topic,
           ct.tokens[ct.cloze_index + 1] as answer,
           ct.folded_tokens[ct.cloze_index + 1] as answer_fold,
           ct.folded_tokens as sentence_folds
    from concept_translations ct
    join concepts c on c.id = ct.concept_id
    where ct.id = p_translation_id and ct.cloze_index is not null
  ),
  raw as (
    select o.tokens[o.cloze_index + 1] as word,
           o.folded_tokens[o.cloze_index + 1] as word_fold,
           (o.cloze_pos is not distinct from t.cloze_pos)::int * 8
             + (right(o.folded_tokens[o.cloze_index + 1], 2)
                = right(t.answer_fold, 2))::int * 2
             + (right(o.folded_tokens[o.cloze_index + 1], 1)
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
           w.folded_tokens[cardinality(w.tokens)],
           (c.part_of_speech is not distinct from t.cloze_pos)::int * 6
             + (c.topic = t.topic)::int * 4
             + (right(w.folded_tokens[cardinality(w.tokens)], 2)
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
    select distinct on (word_fold)
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
      and word_fold <> t.answer_fold
      and not (word_fold = any (t.sentence_folds))
      -- Mid-sentence in German, case is grammar: a noun gap must not be the
      -- only capitalised option (or the only lower-case one).
      and (t.language_code <> 'de' or t.cloze_index = 0
           or (left(word, 1) = lower(left(word, 1))) = (left(t.answer, 1) = lower(left(t.answer, 1))))
    order by word_fold, score desc, random()
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
  with t as materialized (
    select ct.id, ct.language_code, c.skill_id, ct.folded_tokens as folds
    from concept_translations ct
    join concepts c on c.id = ct.concept_id
    where ct.id = p_translation_id
  ),
  words as (
    select distinct on (u.wf) u.w,
           (c.skill_id is not distinct from t.skill_id)::int as same_skill
    from t
    join concept_translations o
      on o.language_code = t.language_code and o.status = 'active'
     and o.tokens is not null and o.id <> t.id
    join concepts c on c.id = o.concept_id and c.status = 'active'
      and c.kind in ('sentence', 'phrase')
    cross join lateral unnest(o.tokens, o.folded_tokens) as u(w, wf)
    where not (u.wf = any (t.folds))
    order by u.wf, random()
  )
  select coalesce(array_agg(w), '{}')
  from (select w from words order by same_skill desc, random() limit greatest(p_n, 0)) s;
$$;

-- ---------------------------------------------------------------------------
-- Course lesson list: count each lesson's playable concepts with one set-based
-- join instead of two EXISTS probes per concept per lesson. Same rows, same
-- order, same "at least four playable concepts" rule.
-- ---------------------------------------------------------------------------

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
  join (
    select lc.lesson_id, count(*)::int as n
    from lesson_concepts lc
    join concepts c on c.id = lc.concept_id and c.status = 'active'
    join concept_translations t
      on t.concept_id = c.id and t.language_code = p_target and t.status = 'active'
    join concept_translations k
      on k.concept_id = c.id and k.language_code = p_known and k.status = 'active'
    group by lc.lesson_id
  ) pc on pc.lesson_id = l.id
  where u.is_active
    and (u.language_code is null or u.language_code = p_target)
    and pc.n >= 4;
$$;
