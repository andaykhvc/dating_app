-- 99990_learning_enums.sql
-- Enum values and language columns the learning-content engine needs.
--
-- Numbered 9999x so it sorts after the 999x fix-up migrations already applied
-- to the hosted project; the Supabase CLI orders versions as strings.
--
-- New enum values live in their own migration: Postgres cannot use a value
-- added by ALTER TYPE in the same transaction that added it.

alter type xp_reason add value if not exists 'lesson_completed';
alter type xp_reason add value if not exists 'review_completed';
alter type xp_reason add value if not exists 'phrase_used_in_chat';

create type concept_kind as enum ('word', 'phrase', 'sentence');

-- needs_review: imported but not yet trusted, never served to learners.
-- disabled: pulled from circulation (bad translation, offensive, duplicate...).
create type content_status as enum ('active', 'needs_review', 'disabled');

-- BCP 47 locale handed to the browser's SpeechSynthesis for listening
-- exercises. Free, on-device, and allowed to be missing.
alter table languages add column if not exists speech_locale text;

update languages set speech_locale = v.locale
from (values
  ('en', 'en-GB'), ('de', 'de-DE'), ('es', 'es-ES'), ('nl', 'nl-NL'),
  ('tr', 'tr-TR'), ('fr', 'fr-FR'), ('it', 'it-IT'), ('pt', 'pt-PT'),
  ('pl', 'pl-PL'), ('sv', 'sv-SE')
) as v(code, locale)
where languages.code = v.code and languages.speech_locale is null;

-- Dutch now has a full course, so it joins the launch languages. (A fresh
-- database gets this from supabase/seed/0001_reference.sql instead.)
update languages set is_launch_language = true where code in ('nl', 'tr');
