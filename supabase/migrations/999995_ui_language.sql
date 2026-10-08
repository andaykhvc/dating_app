-- 999995_ui_language.sql
-- The app language a person chose (issue #34), so it follows the account across
-- devices. Null = never chosen (the browser's language decides). Which codes
-- the app actually offers is src/i18n/config.ts; the database only checks the
-- shape so adding a language does not need a migration.
alter table public.profiles
  add column ui_language text check (ui_language ~ '^[a-z]{2}(-[A-Z]{2})?$');

-- Own row only: the existing profiles_update_own policy applies.
grant update (ui_language) on public.profiles to authenticated;
