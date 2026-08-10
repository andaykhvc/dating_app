-- 0010_rls_policies.sql
-- The security boundary for the whole app.
--
-- Two rules drive every policy below:
--   1. Default deny. RLS is enabled everywhere; an operation with no policy is
--      unreachable from the client no matter what GRANTs exist. Tables whose
--      integrity matters (matches, xp_events, user_progress, game_sessions,
--      match_missions, swipes) therefore have NO write policies at all -- the
--      SECURITY DEFINER functions in 0011 are their only writers.
--   2. You can only read your own row. Nobody selects another user's profile
--      row directly; other people are reached exclusively through the shaped
--      RPCs in 0011, which choose their columns explicitly. That is what keeps
--      date_of_birth and discovery preferences from ever leaving the database.

-- ---------------------------------------------------------------------------
-- Policy helpers. SECURITY DEFINER so they can consult rows the caller cannot
-- select (e.g. a block someone else placed on them).
-- ---------------------------------------------------------------------------

create or replace function public.is_blocked_pair(p_other_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from blocks
    where (blocker_id = auth.uid() and blocked_id = p_other_id)
       or (blocker_id = p_other_id and blocked_id = auth.uid())
  );
$$;

create or replace function public.is_match_member(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from matches
    where id = p_match_id
      and auth.uid() in (user_a, user_b)
  );
$$;

create or replace function public.is_active_match_member(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from matches
    where id = p_match_id
      and status = 'active'
      and auth.uid() in (user_a, user_b)
  );
$$;

-- A correction is only valid on a partner's message inside an active match.
create or replace function public.can_correct_message(p_message_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from messages m
    join matches mt on mt.id = m.match_id
    where m.id = p_message_id
      and m.sender_id <> auth.uid()
      and mt.status = 'active'
      and auth.uid() in (mt.user_a, mt.user_b)
  );
$$;

grant execute on function public.is_blocked_pair(uuid) to authenticated;
grant execute on function public.is_match_member(uuid) to authenticated;
grant execute on function public.is_active_match_member(uuid) to authenticated;
grant execute on function public.can_correct_message(bigint) to authenticated;

-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table languages enable row level security;
alter table interests enable row level security;
alter table user_languages enable row level security;
alter table user_interests enable row level security;
alter table profile_photos enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;
alter table messages enable row level security;
alter table message_corrections enable row level security;
alter table example_sentences enable row level security;
alter table vocabulary_words enable row level security;
alter table conversation_prompts enable row level security;
alter table game_templates enable row level security;
alter table game_content enable row level security;
alter table game_sessions enable row level security;
alter table missions enable row level security;
alter table match_missions enable row level security;
alter table xp_events enable row level security;
alter table user_progress enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: own row only. Row creation belongs to the handle_new_user trigger.
-- Column grants stop a user promoting their own account_status or verification
-- badge, which RLS alone cannot express.
-- ---------------------------------------------------------------------------
create policy profiles_select_own on profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

revoke update on profiles from authenticated;
grant update (
  first_name,
  date_of_birth,
  is_18_plus_confirmed,
  country_code,
  city,
  bio,
  intentions,
  preferred_age_min,
  preferred_age_max,
  preferred_countries,
  onboarding_completed_at,
  updated_at
) on profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Reference and content tables: readable by any signed-in user, never writable.
-- ---------------------------------------------------------------------------
create policy languages_select on languages
  for select to authenticated using (true);

create policy interests_select on interests
  for select to authenticated using (true);

create policy example_sentences_select on example_sentences
  for select to authenticated using (true);

create policy vocabulary_words_select on vocabulary_words
  for select to authenticated using (true);

create policy conversation_prompts_select on conversation_prompts
  for select to authenticated using (true);

create policy game_templates_select on game_templates
  for select to authenticated using (is_active);

create policy missions_select on missions
  for select to authenticated using (is_active);

-- game_content deliberately has NO select policy. Its payload holds the answer
-- keys, so a client that could read the table could read every answer. It is
-- reachable only through start_game_session() / get_game_session(), which strip
-- the key first, and complete_game_session(), which does the grading.

-- ---------------------------------------------------------------------------
-- Profile composition: users manage their own rows; other people's rows are
-- only ever returned through the shaped RPCs.
-- ---------------------------------------------------------------------------
create policy user_languages_own on user_languages
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_interests_own on user_interests
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy profile_photos_own on profile_photos
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Matching. Swipes are insert-only via record_swipe, so a client can never
-- fabricate the reverse like that would manufacture a match. Reading is limited
-- to your own outgoing swipes: who liked you is revealed by a match, not a query.
-- ---------------------------------------------------------------------------
create policy swipes_select_own on swipes
  for select to authenticated
  using (swiper_id = auth.uid());

create policy matches_select_member on matches
  for select to authenticated
  using (auth.uid() in (user_a, user_b));

-- Blocks are created through block_user() so blocking also ends the match.
-- Unblocking is a plain delete with no side effects.
create policy blocks_select_own on blocks
  for select to authenticated
  using (blocker_id = auth.uid());

create policy blocks_delete_own on blocks
  for delete to authenticated
  using (blocker_id = auth.uid());

create policy reports_insert_own on reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and reported_id <> auth.uid());

create policy reports_select_own on reports
  for select to authenticated
  using (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Chat. History stays readable after an unmatch; only sending requires the
-- match to still be active.
-- ---------------------------------------------------------------------------
create policy messages_select_member on messages
  for select to authenticated
  using (public.is_match_member(match_id));

create policy messages_insert_member on messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_active_match_member(match_id)
  );

-- The recipient flips sent -> delivered. The column grant is what stops them
-- rewriting the body of a message they received.
create policy messages_update_delivery on messages
  for update to authenticated
  using (public.is_match_member(match_id) and sender_id <> auth.uid())
  with check (public.is_match_member(match_id) and sender_id <> auth.uid());

revoke update on messages from authenticated;
grant update (delivery_state) on messages to authenticated;

create policy message_corrections_select_member on message_corrections
  for select to authenticated
  using (
    exists (
      select 1 from messages m
      where m.id = message_corrections.message_id
        and public.is_match_member(m.match_id)
    )
  );

create policy message_corrections_insert on message_corrections
  for insert to authenticated
  with check (
    corrector_id = auth.uid()
    and public.can_correct_message(message_id)
  );

-- ---------------------------------------------------------------------------
-- Games, missions, progress. Read-only from the client; every state transition
-- and every point of XP is written by a SECURITY DEFINER function in 0011.
-- ---------------------------------------------------------------------------
create policy game_sessions_select on game_sessions
  for select to authenticated
  using (
    initiator_id = auth.uid()
    or (match_id is not null and public.is_match_member(match_id))
  );

create policy match_missions_select on match_missions
  for select to authenticated
  using (public.is_match_member(match_id));

create policy xp_events_select_own on xp_events
  for select to authenticated
  using (user_id = auth.uid());

create policy user_progress_select_own on user_progress
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime: only the chat table is published. Postgres Changes still applies
-- the SELECT policy above, so a subscriber receives nothing they cannot read.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table message_corrections;
