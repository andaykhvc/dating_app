-- 0002_core_tables.sql
-- Identity, reference data, and profile composition.

-- The onboarding fields are nullable because the row is created by a trigger
-- the instant the auth user exists, then filled in step by step. Completeness
-- and the 18+ rule are enforced by enforce_profile_rules() in 0011: a CHECK
-- constraint cannot call current_date, and the app must never be able to mark
-- onboarding complete with fields missing.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text check (char_length(first_name) between 1 and 40),
  date_of_birth date,
  is_18_plus_confirmed boolean not null default false,
  country_code text check (char_length(country_code) = 2),
  city text check (char_length(city) <= 80),
  bio text check (char_length(bio) <= 300),
  intentions intention_type[] not null default '{}',
  preferred_age_min smallint not null default 18 check (preferred_age_min >= 18),
  preferred_age_max smallint not null default 99 check (preferred_age_max <= 120),
  preferred_countries text[] not null default '{}',
  -- Discovery filter: hide people who are open to dating.
  hide_dating_profiles boolean not null default false,
  -- Denormalized from profile_photos (position 0) so discovery cards need no join.
  primary_photo_path text,
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'deleted')),
  -- Placeholder for a future verification flow; nothing writes it today.
  is_photo_verified boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (preferred_age_max >= preferred_age_min)
);

create table languages (
  code text primary key check (char_length(code) between 2 and 5),
  name text not null,
  native_name text,
  flag_emoji text,
  is_launch_language boolean not null default false
);

create table interests (
  id smallint generated always as identity primary key,
  key text not null unique,
  label text not null,
  emoji text
);

create table user_languages (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  language_code text not null references languages (code),
  role text not null check (role in ('native', 'learning')),
  cefr_level cefr_level,
  created_at timestamptz not null default now(),
  unique (user_id, language_code, role),
  check (
    (role = 'native' and cefr_level is null)
    or (role = 'learning' and cefr_level is not null)
  )
);

create table user_interests (
  user_id uuid not null references profiles (id) on delete cascade,
  interest_id smallint not null references interests (id) on delete cascade,
  primary key (user_id, interest_id)
);

-- position 0..5 plus the unique constraint is the photo cap: six per user,
-- enforced by the schema rather than by a counting trigger.
create table profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  storage_path text not null,
  position smallint not null check (position between 0 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, position)
);
