-- 99991_content_engine_tables.sql
-- The language-learning content engine: provenance, language-agnostic
-- concepts, the A1–B1 curriculum, and per-user learning state.
--
-- Shape in one paragraph: a *concept* is one meaning ("coffee", "What music do
-- you like?"). It is realised once per language in *concept_translations*. The
-- curriculum (units -> skills -> lessons) points at concepts, never at text, so
-- a single lesson serves every direction (tr->de, de->tr, es->nl, ...) and a new
-- language is new translation rows, not a new course. Exercises are generated
-- from concepts at lesson start; none are stored as content.
--
-- The existing vocabulary_words / example_sentences tables are the old flat,
-- English-pivot library. Nothing reads them; this model supersedes them.

-- ---------------------------------------------------------------------------
-- Provenance
-- ---------------------------------------------------------------------------

create table content_sources (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,40}$'),
  name text not null,
  source_type text not null
    check (source_type in ('editorial', 'dataset', 'reference_data')),
  source_url text,
  license text not null,
  license_url text,
  author text,
  -- What the Licenses & Attributions page prints for this source.
  attribution_text text not null,
  commercial_use_allowed boolean not null,
  modification_allowed boolean not null,
  share_alike boolean not null default false,
  -- CC BY sources (Tatoeba) require crediting the author of each item.
  requires_item_attribution boolean not null default false,
  is_enabled boolean not null default true,
  notes text,
  license_verified_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The licensing rule enforced by the schema rather than by good intentions:
  -- a source whose terms would not let us ship it commercially, modify it, or
  -- keep our own database free of share-alike obligations cannot be enabled.
  constraint content_sources_licence_usable check (
    not is_enabled
    or (commercial_use_allowed and modification_allowed and not share_alike)
  )
);

create table content_import_batches (
  id bigint generated always as identity primary key,
  source_id text not null references content_sources (id),
  tool text not null,
  label text,
  item_count integer not null default 0 check (item_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  stats jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Curriculum: course -> unit -> skill -> lesson. language_code null means the
-- row is shared by every course; a value makes it language-specific (German
-- articles, Turkish vowel harmony), so sequencing can differ per language
-- without forking the whole curriculum.
-- ---------------------------------------------------------------------------

create table courses (
  language_code text primary key references languages (code),
  title text not null,
  description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table units (
  id bigint generated always as identity primary key,
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9-]*$'),
  cefr_level cefr_level not null,
  position smallint not null,
  title text not null,
  description text,
  language_code text references languages (code),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table skills (
  id bigint generated always as identity primary key,
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9-]*$'),
  unit_id bigint not null references units (id) on delete cascade,
  position smallint not null,
  title text not null,
  description text,
  icon text,
  language_code text references languages (code),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table lessons (
  id bigint generated always as identity primary key,
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9-]*$'),
  skill_id bigint not null references skills (id) on delete cascade,
  position smallint not null,
  title text not null,
  -- learn: introduces new concepts. practice: recombines the whole skill.
  lesson_type text not null default 'learn' check (lesson_type in ('learn', 'practice')),
  language_code text references languages (code),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Concepts and their per-language realisations
-- ---------------------------------------------------------------------------

create table concepts (
  id bigint generated always as identity primary key,
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9_.-]*$'),
  kind concept_kind not null,
  part_of_speech text check (part_of_speech in (
    'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition',
    'conjunction', 'determiner', 'numeral', 'interjection', 'phrase'
  )),
  cefr_level cefr_level not null,
  -- Semantic field (drinks, family, weekdays...). Drives distractor choice:
  -- "Kaffee = ?" offers tea and milk, not airport and Tuesday.
  topic text not null check (topic ~ '^[a-z0-9][a-z0-9-]*$'),
  -- The skill that teaches it. A concept can still appear in other lessons.
  skill_id bigint references skills (id) on delete set null,
  -- Concepts that share a group are near-synonyms somewhere ("hi"/"hello")
  -- and are never offered as each other's wrong answer.
  sense_group text,
  -- Editorial English description; disambiguates "right (direction)".
  gloss text not null,
  -- For context-choice exercises: when would you say this?
  situation text,
  -- Worth asking a real person: offered as a "use it with a match" phrase.
  is_social boolean not null default false,
  status content_status not null default 'active',
  source_id text not null references content_sources (id),
  import_batch_id bigint references content_import_batches (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table concept_translations (
  id bigint generated always as identity primary key,
  concept_id bigint not null references concepts (id) on delete cascade,
  language_code text not null references languages (code),
  text text not null check (char_length(text) between 1 and 160),
  -- Other answers accepted when the learner types (e.g. the noun without its
  -- article, a contraction). Never shown as an option.
  alternatives text[] not null default '{}',
  -- Word-order tiles, precomputed by the build script so the database never
  -- has to tokenise Turkish apostrophes or Spanish inverted marks itself.
  tokens text[],
  -- Which token the missing-word exercise blanks, and that token's part of
  -- speech so its wrong options can be the same kind of word.
  cloze_index smallint check (cloze_index >= 0),
  cloze_pos text,
  gender text check (gender in ('m', 'f', 'n', 'c', 'pl')),
  note text,
  status content_status not null default 'active',
  source_id text not null references content_sources (id),
  source_external_id text,
  source_author text,
  -- Only when an item's licence differs from its source's (Tatoeba's CC0 subset).
  license text,
  import_batch_id bigint references content_import_batches (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_id, language_code),
  check (cloze_index is null or (tokens is not null and cloze_index < cardinality(tokens)))
);

create table lesson_concepts (
  lesson_id bigint not null references lessons (id) on delete cascade,
  concept_id bigint not null references concepts (id) on delete cascade,
  position smallint not null default 0,
  primary key (lesson_id, concept_id)
);

-- The exercise mechanics. Rows are configuration for code in 99993: switching
-- one off (is_active = false) removes it from every generated lesson.
create table exercise_templates (
  key text primary key,
  title text not null,
  description text not null,
  concept_kinds concept_kind[] not null,
  min_cefr cefr_level not null default 'A1',
  needs_audio boolean not null default false,
  is_graded boolean not null default true,
  is_active boolean not null default true
);

insert into exercise_templates (key, title, description, concept_kinds, needs_audio, is_graded) values
  ('new_words',        'New words',          'Meet the new words before being tested on them.',           '{word,phrase}',          false, false),
  ('vocab_choice',     'What does it mean?', 'See a word in the target language, pick its meaning.',      '{word,phrase}',          false, true),
  ('vocab_recall',     'How do you say it?', 'See a meaning, pick the word in the target language.',      '{word,phrase}',          false, true),
  ('match_pairs',      'Match the pairs',    'Pair four words with their meanings.',                      '{word,phrase}',          false, true),
  ('type_translation', 'Type it',            'Type the target-language word for a meaning.',              '{word,phrase}',          false, true),
  ('listen_choice',    'Listen and pick',    'Hear it, then pick what was said.',                         '{word,phrase,sentence}', true,  true),
  ('listen_type',      'Type what you hear', 'Hear it, then type it.',                                    '{word,phrase,sentence}', true,  true),
  ('missing_word',     'Fill the gap',       'Pick the word missing from a sentence.',                    '{sentence,phrase}',      false, true),
  ('word_order',       'Build the sentence', 'Put the words in order to match a translation.',            '{sentence,phrase}',      false, true),
  ('word_bank',        'Translate it',       'Translate a sentence using word tiles, with decoys.',       '{sentence,phrase}',      false, true),
  ('sentence_choice',  'Which translation?', 'Read a sentence, pick the correct translation.',            '{sentence,phrase}',      false, true),
  ('true_false',       'True or false',      'Decide whether a translation is right.',                    '{sentence,phrase}',      false, true),
  ('context_choice',   'What would you say?','Pick the phrase that fits a situation.',                    '{sentence,phrase}',      false, true)
on conflict (key) do nothing;

-- Learner reports ("this translation is wrong") and validator findings land
-- here for review in Supabase Studio.
create table content_flags (
  id bigint generated always as identity primary key,
  concept_id bigint not null references concepts (id) on delete cascade,
  language_code text references languages (code),
  reason text not null check (reason in (
    'wrong_translation', 'typo', 'unnatural', 'offensive', 'audio', 'other'
  )),
  note text check (char_length(note) <= 500),
  reporter_id uuid references profiles (id) on delete set null,
  origin text not null default 'user' check (origin in ('user', 'validator', 'admin')),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Learner state
-- ---------------------------------------------------------------------------

-- One generated play-through. exercises holds the answer keys, so like
-- game_content this table has no client read policy: it is reachable only
-- through functions that strip the keys.
create table lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  mode text not null check (mode in ('lesson', 'review')),
  lesson_id bigint references lessons (id) on delete set null,
  language_code text not null references languages (code),
  known_language_code text not null references languages (code),
  exercises jsonb not null,
  -- Keyed by exercise index: {"3": {"correct": false, "given": ...}}.
  results jsonb not null default '{}',
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  xp_awarded smallint not null default 0,
  score smallint check (score between 0 and 100),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (mode = 'review' or lesson_id is not null or status <> 'in_progress')
);

-- Spaced repetition, one row per learner x target language x concept.
-- Leitner boxes 0..5: 0 is (re)learning, 5 is a month between reviews.
create table user_concept_progress (
  user_id uuid not null references profiles (id) on delete cascade,
  language_code text not null references languages (code),
  concept_id bigint not null references concepts (id) on delete cascade,
  box smallint not null default 0 check (box between 0 and 5),
  mastery smallint generated always as (box * 20) stored,
  times_seen integer not null default 0,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  streak smallint not null default 0,
  last_result boolean,
  last_seen_at timestamptz,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, language_code, concept_id)
);

-- Lessons are shared across languages, so progress is per target language.
create table user_lesson_progress (
  user_id uuid not null references profiles (id) on delete cascade,
  language_code text not null references languages (code),
  lesson_id bigint not null references lessons (id) on delete cascade,
  times_completed integer not null default 0,
  best_score smallint not null default 0 check (best_score between 0 and 100),
  last_score smallint not null default 0 check (last_score between 0 and 100),
  first_completed_at timestamptz,
  last_completed_at timestamptz,
  primary key (user_id, language_code, lesson_id)
);

-- "Use it with a match": a learned phrase the user chose to take into a real
-- chat. Sending a message that contains it earns XP once (see 99993).
create table phrase_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  match_id uuid not null references matches (id) on delete cascade,
  concept_id bigint not null references concepts (id) on delete cascade,
  language_code text not null references languages (code),
  text text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_message_id bigint references messages (id) on delete set null
);
