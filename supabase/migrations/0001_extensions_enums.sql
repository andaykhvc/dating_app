-- 0001_extensions_enums.sql
-- Extensions and shared enum types for Lingua Match.

create extension if not exists "pgcrypto";

-- What a user is looking for. Dating is deliberately one option among several,
-- never the default, and is filterable by other users.
create type intention_type as enum (
  'language_buddy',
  'friendship',
  'cultural_exchange',
  'open_to_dating'
);

create type cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

create type game_template_type as enum (
  'missing_word',
  'translation_choice',
  'word_order',
  'ask_your_partner',
  'conversation_mission',
  'voice_challenge',
  'correction_challenge'
);

create type xp_reason as enum (
  'game_session_completed',
  'correction_given',
  'correction_received',
  'mission_completed',
  'daily_streak_bonus'
);
