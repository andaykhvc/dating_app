-- 0006_game_tables.sql
-- Reusable challenge engine: a template defines the mechanic, content rows
-- supply the data, sessions record a single play-through.

create table game_templates (
  id smallint generated always as identity primary key,
  key text not null unique,
  type game_template_type not null,
  title text not null,
  description text not null,
  instructions text,
  default_xp_reward smallint not null default 10 check (default_xp_reward between 0 and 200),
  -- Free-text types have no machine-checkable answer, so completion is self-reported.
  is_gradable boolean not null default false,
  -- Solo templates can be played from the Play hub without a match.
  is_solo boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- payload shape varies per template type; the contract lives in
-- src/features/games/engine/types.ts as a discriminated union.
create table game_content (
  id uuid primary key default gen_random_uuid(),
  game_template_id smallint not null references game_templates (id) on delete cascade,
  language_code text not null references languages (code),
  cefr_level cefr_level not null,
  payload jsonb not null,
  source text,
  source_license text,
  source_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_template_id smallint not null references game_templates (id),
  game_content_id uuid references game_content (id) on delete set null,
  match_id uuid references matches (id) on delete cascade,
  match_mission_id uuid,
  initiator_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  state jsonb not null default '{}',
  is_correct boolean,
  xp_awarded smallint not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
