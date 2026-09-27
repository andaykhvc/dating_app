-- 99992_content_engine_rls_indexes.sql
-- Indexes and the security boundary for the learning-content engine.
--
-- Same two rules as 0010: default deny, and only your own rows. On top:
--   * Canonical content (concepts, translations, curriculum) is never
--     writable from the client. The seed scripts run as the database owner.
--   * concepts / concept_translations / lesson_sessions have NO client read
--     policy. Between them they hold every answer key; lessons reach the
--     browser only through the functions in 99993, which strip the keys.
--   * XP, SRS state and lesson progress are written only by those functions.

-- ---------------------------------------------------------------------------
-- Indexes: each backs a query in 99993.
-- ---------------------------------------------------------------------------

-- Realisation lookup by (language, concept) is the hot path of every exercise
-- builder; the unique (concept_id, language_code) serves the reverse order.
create index concept_translations_lang_concept_idx
  on concept_translations (language_code, concept_id)
  where status = 'active';

-- Distractor candidates: same kind and part of speech, ranked by topic/skill.
create index concepts_distractor_idx
  on concepts (kind, part_of_speech, topic)
  where status = 'active';
create index concepts_skill_id_idx on concepts (skill_id);

create index skills_unit_id_idx on skills (unit_id, position);
create index lessons_skill_id_idx on lessons (skill_id, position);
create index units_order_idx on units (cefr_level, position);
create index lesson_concepts_concept_id_idx on lesson_concepts (concept_id);

create index content_flags_open_idx on content_flags (created_at desc) where status = 'open';
create index content_flags_concept_idx on content_flags (concept_id);
create index content_import_batches_source_idx on content_import_batches (source_id);
create index concepts_source_idx on concepts (source_id);
create index concept_translations_source_idx on concept_translations (source_id);

-- The review queue: due items for one learner in one language.
create index user_concept_progress_due_idx
  on user_concept_progress (user_id, language_code, next_review_at);

create index lesson_sessions_user_idx on lesson_sessions (user_id, created_at desc);
-- Starting a session abandons the learner's stale in-progress ones.
create index lesson_sessions_in_progress_idx
  on lesson_sessions (user_id) where status = 'in_progress';

-- The message trigger looks for a pending share for (sender, match) on every
-- insert; partial, so it stays tiny however many phrases were ever shared.
create index phrase_shares_pending_idx
  on phrase_shares (user_id, match_id) where used_at is null;
create index phrase_shares_match_idx on phrase_shares (match_id);
create index phrase_shares_concept_idx on phrase_shares (concept_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table content_sources enable row level security;
alter table content_import_batches enable row level security;
alter table courses enable row level security;
alter table units enable row level security;
alter table skills enable row level security;
alter table lessons enable row level security;
alter table concepts enable row level security;
alter table concept_translations enable row level security;
alter table lesson_concepts enable row level security;
alter table exercise_templates enable row level security;
alter table content_flags enable row level security;
alter table lesson_sessions enable row level security;
alter table user_concept_progress enable row level security;
alter table user_lesson_progress enable row level security;
alter table phrase_shares enable row level security;

-- Attribution is public: the Licenses page works signed out.
create policy content_sources_select on content_sources
  for select to anon, authenticated using (true);

-- Curriculum structure carries no answers; readable, never writable.
create policy courses_select on courses
  for select to authenticated using (is_published);
create policy units_select on units
  for select to authenticated using (is_active);
create policy skills_select on skills
  for select to authenticated using (is_active);
create policy lessons_select on lessons
  for select to authenticated using (is_active);
create policy exercise_templates_select on exercise_templates
  for select to authenticated using (is_active);

-- concepts, concept_translations, lesson_concepts, content_import_batches and
-- lesson_sessions: deliberately no policies (see header).

-- A learner can report a problem and see their own reports; nothing else.
create policy content_flags_insert_own on content_flags
  for insert to authenticated
  with check (reporter_id = auth.uid() and origin = 'user' and status = 'open');
create policy content_flags_select_own on content_flags
  for select to authenticated
  using (reporter_id = auth.uid());

create policy user_concept_progress_select_own on user_concept_progress
  for select to authenticated using (user_id = auth.uid());
create policy user_lesson_progress_select_own on user_lesson_progress
  for select to authenticated using (user_id = auth.uid());
create policy phrase_shares_select_own on phrase_shares
  for select to authenticated using (user_id = auth.uid());

-- Belt and braces: the table-level grants Supabase hands out by default are
-- narrowed so a missing policy is not the only thing standing in the way.
revoke insert, update, delete, truncate on
  content_sources, content_import_batches, courses, units, skills, lessons,
  concepts, concept_translations, lesson_concepts, exercise_templates,
  lesson_sessions, user_concept_progress, user_lesson_progress, phrase_shares
from anon, authenticated;

revoke update, delete, truncate on content_flags from anon, authenticated;
revoke all on content_flags from anon;
