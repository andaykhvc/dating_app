-- 0008_progress_tables.sql
-- XP ledger plus the pre-aggregated row the UI actually reads.

create table xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  amount smallint not null check (amount > 0 and amount <= 500),
  reason xp_reason not null,
  source_table text,
  source_id text,
  created_at timestamptz not null default now()
);

-- Never derived with sum(xp_events) at read time: the UI reads this row so page
-- load cost stays flat no matter how much history accumulates.
create table user_progress (
  user_id uuid primary key references profiles (id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  level smallint not null default 1 check (level >= 1),
  current_streak_days smallint not null default 0 check (current_streak_days >= 0),
  longest_streak_days smallint not null default 0 check (longest_streak_days >= 0),
  last_activity_date date,
  league text not null default 'bronze' check (league in ('bronze', 'silver', 'gold')),
  updated_at timestamptz not null default now()
);
