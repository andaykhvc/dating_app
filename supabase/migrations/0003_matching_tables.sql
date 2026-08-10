-- 0003_matching_tables.sql
-- Swipes, matches, and the safety tables that gate them.

create table swipes (
  id bigint generated always as identity primary key,
  swiper_id uuid not null references profiles (id) on delete cascade,
  swipee_id uuid not null references profiles (id) on delete cascade,
  action text not null check (action in ('like', 'pass')),
  created_at timestamptz not null default now(),
  unique (swiper_id, swipee_id),
  check (swiper_id <> swipee_id)
);

-- user_a is always the lexicographically smaller uuid, so the unique constraint
-- makes a duplicate match physically impossible regardless of who swiped first.
create table matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles (id) on delete cascade,
  user_b uuid not null references profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'unmatched')),
  matched_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

create table blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  reported_id uuid not null references profiles (id) on delete cascade,
  match_id uuid references matches (id) on delete set null,
  message_id bigint,
  reason text not null check (
    reason in ('spam', 'harassment', 'inappropriate_content', 'fake_profile', 'underage', 'other')
  ),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
