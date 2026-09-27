-- 99994_security_lint_fixes.sql
-- Closes every finding from the Supabase database linter (2026-09-27 report):
--   * function_search_path_mutable        -- functions without a pinned search_path
--   * anon_security_definer_function_executable
--   * authenticated_security_definer_function_executable
--   * public_bucket_allows_listing
--
-- Background on the exec-privilege findings: Postgres grants EXECUTE to
-- PUBLIC on function creation, and Supabase additionally grants EXECUTE to
-- `anon` and `authenticated` directly (see the note in
-- 99993_content_engine_functions.sql). Every earlier migration that later did
-- `grant execute ... to authenticated` therefore left the *default* anon/
-- public grant untouched -- the explicit grant was additive, never a
-- replacement. This migration revokes those default grants everywhere they
-- were missed.

-- ---------------------------------------------------------------------------
-- function_search_path_mutable
-- ---------------------------------------------------------------------------

alter function public.enforce_profile_rules() set search_path = public;
alter function public.strip_answer(game_template_type, jsonb) set search_path = public;
alter function public.profile_age(date) set search_path = public;
alter function public.learn_norm(text) set search_path = public;
alter function public.learn_fold(text) set search_path = public;
alter function public.learn_shuffle(jsonb) set search_path = public;
alter function public.learn_box_interval(smallint) set search_path = public;
alter function public.learn_strip_exercises(jsonb) set search_path = public;
alter function public.learn_grade(jsonb, jsonb) set search_path = public;

-- ---------------------------------------------------------------------------
-- anon_security_definer_function_executable /
-- authenticated_security_definer_function_executable
-- ---------------------------------------------------------------------------

-- Trigger-only functions: never invoked directly, so no role needs EXECUTE.
-- (Trigger firing does not check EXECUTE on the trigger function.)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_primary_photo() from public, anon, authenticated;
revoke execute on function public.award_correction_xp() from public, anon, authenticated;

-- Internal-only helpers: already revoked from public/authenticated in
-- 0011_functions_triggers.sql, but not from anon.
revoke execute on function public.grant_xp(uuid, smallint, xp_reason, text, text) from anon;
revoke execute on function public.assign_next_mission(uuid) from anon;

-- RLS policy helpers: evaluated as `authenticated` inside policy USING
-- clauses, but never called directly by anon or by client code.
revoke execute on function public.is_blocked_pair(uuid) from public, anon;
revoke execute on function public.is_match_member(uuid) from public, anon;
revoke execute on function public.is_active_match_member(uuid) from public, anon;
revoke execute on function public.can_correct_message(bigint) from public, anon;

-- Authenticated-only RPCs (0011_functions_triggers.sql): signed-in writers.
revoke execute on function public.advance_match_mission(uuid) from public, anon;
revoke execute on function public.record_swipe(uuid, text) from public, anon;
revoke execute on function public.block_user(uuid) from public, anon;
revoke execute on function public.unmatch(uuid) from public, anon;
revoke execute on function public.start_game_session(smallint, uuid, uuid) from public, anon;
revoke execute on function public.complete_game_session(uuid, jsonb) from public, anon;

-- Authenticated-only RPCs (0012_read_functions.sql): shaped reads of other
-- people's data, gated on auth.uid().
revoke execute on function public.discover_profiles(int) from public, anon;
revoke execute on function public.get_matches() from public, anon;
revoke execute on function public.get_profile_card(uuid) from public, anon;
revoke execute on function public.get_play_overview() from public, anon;
revoke execute on function public.get_game_session(uuid) from public, anon;
revoke execute on function public.get_blocked_users() from public, anon;

-- public.get_content_attributions() is intentionally callable by anon and
-- authenticated alike (99993_content_engine_functions.sql) -- it returns
-- nothing but public source/licence metadata, so it is left as-is.

-- ---------------------------------------------------------------------------
-- public_bucket_allows_listing
-- ---------------------------------------------------------------------------

-- profile-photos is a public bucket: object URLs are served by Storage's own
-- public-object endpoint, which checks storage.buckets.public rather than
-- this RLS policy. The SELECT policy therefore adds nothing for normal photo
-- rendering, but it does let any client run
-- `select * from storage.objects where bucket_id = 'profile-photos'` and
-- enumerate every uploaded file's path (and thus every user id), which the
-- app never asks for -- photo listings always come from the `profile_photos`
-- table. Dropping it removes that enumeration surface with no loss of
-- functionality.
drop policy if exists "Profile photos are publicly readable" on storage.objects;

-- ---------------------------------------------------------------------------
-- auth_leaked_password_protection
-- ---------------------------------------------------------------------------
-- Not fixable from a SQL migration: it is a project-level Auth setting (calls
-- out to HaveIBeenPwned on password set/change), not a database object.
-- Enable it in the Supabase Dashboard under
-- Authentication -> Sign In / Providers -> Password -> "Leaked password
-- protection", or via the Management API
-- (PATCH /v1/projects/{ref}/config/auth {"password_hibp_enabled": true}).
