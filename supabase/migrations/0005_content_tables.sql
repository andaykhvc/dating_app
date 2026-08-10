-- 0005_content_tables.sql
-- Static language content library. Source/license columns exist from day one so
-- an external open dataset can be bulk-loaded later without a migration.

create table example_sentences (
  id uuid primary key default gen_random_uuid(),
  language_code text not null references languages (code),
  cefr_level cefr_level not null,
  text text not null,
  translation_en text,
  source text,
  source_license text,
  source_url text,
  created_at timestamptz not null default now()
);

create table vocabulary_words (
  id uuid primary key default gen_random_uuid(),
  language_code text not null references languages (code),
  cefr_level cefr_level not null,
  word text not null,
  translation_en text,
  part_of_speech text,
  example_sentence_id uuid references example_sentences (id) on delete set null,
  source text,
  source_license text,
  source_url text,
  created_at timestamptz not null default now(),
  unique (language_code, word)
);

-- language_code is nullable: prompts like "ask about their hometown" work in any language.
create table conversation_prompts (
  id uuid primary key default gen_random_uuid(),
  language_code text references languages (code),
  cefr_level cefr_level,
  topic text,
  prompt text not null,
  source text,
  source_license text,
  source_url text,
  created_at timestamptz not null default now()
);
