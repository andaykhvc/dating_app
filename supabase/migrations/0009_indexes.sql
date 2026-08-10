-- 0009_indexes.sql
-- Only indexes that back a query the app actually issues. Unique constraints
-- from earlier migrations already create their own indexes and are not repeated:
--   swipes (swiper_id, swipee_id)  -> serves both "already swiped" and the
--                                     reverse-like check inside record_swipe
--   matches (user_a, user_b)       -> serves user_a lookups
--   message_corrections (message_id)

-- Discovery feed: the candidate pool is only ever complete, active profiles.
create index profiles_discoverable_idx
  on profiles (created_at desc)
  where onboarding_completed_at is not null and account_status = 'active';

create index profiles_country_code_idx on profiles (country_code);
create index profiles_intentions_idx on profiles using gin (intentions);

create index user_languages_user_id_idx on user_languages (user_id);
create index user_languages_language_role_idx on user_languages (language_code, role);
create index user_interests_interest_id_idx on user_interests (interest_id);
create index profile_photos_user_id_idx on profile_photos (user_id, position);

-- "All my matches" is `where user_a = me or user_b = me`; user_a is covered by
-- the unique constraint, user_b needs its own index.
create index matches_user_b_idx on matches (user_b);

create index blocks_blocked_id_idx on blocks (blocked_id);
create index reports_reported_id_idx on reports (reported_id);
create index reports_status_idx on reports (status) where status = 'open';

-- The chat pagination index.
create index messages_match_id_id_idx on messages (match_id, id desc);
create index message_corrections_corrector_id_idx on message_corrections (corrector_id);

create index example_sentences_lang_level_idx on example_sentences (language_code, cefr_level);
create index vocabulary_words_lang_level_idx on vocabulary_words (language_code, cefr_level);
create index conversation_prompts_lang_level_idx on conversation_prompts (language_code, cefr_level);

create index game_content_lookup_idx
  on game_content (game_template_id, language_code, cefr_level)
  where is_active;

create index game_sessions_match_id_idx on game_sessions (match_id);
create index game_sessions_initiator_status_idx on game_sessions (initiator_id, status);
create index game_sessions_match_mission_id_idx on game_sessions (match_mission_id);

-- Exactly one active mission per match at any time.
create unique index match_missions_one_active_idx
  on match_missions (match_id)
  where status = 'active';
create index match_missions_match_id_idx on match_missions (match_id);

create index xp_events_user_created_idx on xp_events (user_id, created_at desc);
