-- 999992_account_deletion.sql
-- In-app account deletion (issue #38).
--
-- The app deletes the auth.users row (Admin API, server side). Every table that
-- references profiles / auth.users already cascades, except that `reports`
-- cascaded on BOTH sides, so deleting someone who had been reported would also
-- have deleted the safety record about them. Cascade audit (per table):
--
--   profiles, user_languages, user_interests, profile_photos, user_progress,
--   xp_events, swipes (both directions), blocks (both), game_sessions,
--   lesson_sessions, user_concept_progress, user_lesson_progress,
--   phrase_shares, message_corrections (as corrector)
--                                  -> deleted with the account (cascade)
--   matches                        -> deleted (cascade). That removes the whole
--                                     thread for BOTH people (messages,
--                                     match_missions, game_sessions in it, phrase
--                                     shares): the other person's list simply no
--                                     longer contains it. Chosen over keeping
--                                     one-sided threads because the messages are
--                                     the leaving user's personal data and half a
--                                     conversation is of little use to the partner.
--   messages (as sender)           -> deleted via the match cascade
--   reports filed BY the user      -> kept, reporter_id set null: the report is
--                                     about someone else's behaviour and stays
--                                     actionable
--   reports filed AGAINST the user -> kept as an anonymous record (reason,
--                                     status, date), reported_id set null and the
--                                     free-text `details` scrubbed. Retained for
--                                     safety / legal-claims purposes (GDPR
--                                     Art. 17(3)(e)); the owner should confirm this
--                                     in the privacy policy.
--   content_flags (reporter)       -> kept, reporter_id already set null
--   storage objects                -> not touched by SQL; removed by the route
--
-- Nothing else restricts deletion (no `on delete restrict` / no-action FKs to
-- profiles or auth.users exist).

alter table public.reports
  alter column reporter_id drop not null,
  alter column reported_id drop not null;

alter table public.reports
  drop constraint reports_reporter_id_fkey,
  drop constraint reports_reported_id_fkey;

alter table public.reports
  add constraint reports_reporter_id_fkey
    foreign key (reporter_id) references public.profiles (id) on delete set null,
  add constraint reports_reported_id_fkey
    foreign key (reported_id) references public.profiles (id) on delete set null;

-- Free text written about a person is scrubbed when that person leaves. Runs
-- BEFORE the delete: afterwards the FK action has already nulled reported_id
-- and the rows could no longer be found.
create or replace function public.scrub_reports_about_deleted_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update reports set details = null where reported_id = old.id;
  return old;
end;
$$;

revoke execute on function public.scrub_reports_about_deleted_profile() from public, anon, authenticated;

create trigger profiles_scrub_reports_before_delete
  before delete on public.profiles
  for each row execute function public.scrub_reports_about_deleted_profile();
