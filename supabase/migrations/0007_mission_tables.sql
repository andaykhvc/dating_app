-- 0007_mission_tables.sql
-- missions is the template pool; match_missions is the per-match instance that
-- gets attached automatically the moment two people match.

create table missions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text not null,
  category text,
  xp_reward_per_step smallint not null default 20 check (xp_reward_per_step between 0 and 200),
  target_steps smallint not null default 1 check (target_steps between 1 and 20),
  related_game_template_id smallint references game_templates (id) on delete set null,
  is_active boolean not null default true,
  -- Daily missions are drawn from the same pool but shown on the Play hub solo.
  is_daily boolean not null default false,
  created_at timestamptz not null default now()
);

create table match_missions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  mission_id uuid not null references missions (id),
  status text not null default 'active' check (status in ('active', 'completed', 'skipped')),
  steps_completed smallint not null default 0 check (steps_completed >= 0),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table game_sessions
  add constraint game_sessions_match_mission_id_fkey
  foreign key (match_mission_id) references match_missions (id) on delete set null;
