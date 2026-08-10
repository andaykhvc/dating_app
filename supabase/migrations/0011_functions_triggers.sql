-- 0011_functions_triggers.sql
-- Every write the client is not trusted to make itself.
--
-- These run as the function owner, so they see past RLS. Each one therefore
-- re-derives the caller from auth.uid() and checks its own preconditions --
-- being SECURITY DEFINER is never treated as permission to skip a check.

-- ---------------------------------------------------------------------------
-- Profile lifecycle
-- ---------------------------------------------------------------------------

-- A profile and a progress row exist from the moment the auth user does, so no
-- other code path ever has to cope with their absence.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, first_name, is_18_plus_confirmed)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce((new.raw_user_meta_data ->> 'is_18_plus_confirmed')::boolean, false)
  )
  on conflict (id) do nothing;

  insert into user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.enforce_profile_rules()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  if new.date_of_birth is not null
     and new.date_of_birth > (current_date - interval '18 years') then
    raise exception 'You must be at least 18 years old to use this app'
      using errcode = 'check_violation';
  end if;

  -- Completing onboarding is the gate that makes a profile discoverable, so it
  -- is also where required fields stop being optional.
  if new.onboarding_completed_at is not null then
    if new.first_name is null
       or new.date_of_birth is null
       or new.country_code is null
       or new.is_18_plus_confirmed is not true
       or array_length(new.intentions, 1) is null then
      raise exception 'Profile is incomplete'
        using errcode = 'check_violation';
    end if;

    if not exists (
      select 1 from user_languages
      where user_id = new.id and role = 'native'
    ) or not exists (
      select 1 from user_languages
      where user_id = new.id and role = 'learning'
    ) then
      raise exception 'Both a native and a learning language are required'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_enforce_rules
  before insert or update on profiles
  for each row execute function public.enforce_profile_rules();

-- Keeps the denormalized discovery-card photo in step with the gallery.
create or replace function public.sync_primary_photo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
begin
  update profiles p
  set primary_photo_path = (
    select storage_path from profile_photos
    where user_id = v_user_id
    order by position
    limit 1
  )
  where p.id = v_user_id;

  return null;
end;
$$;

create trigger profile_photos_sync_primary
  after insert or update or delete on profile_photos
  for each row execute function public.sync_primary_photo();

-- ---------------------------------------------------------------------------
-- XP, levels and streaks. Internal only: never granted to authenticated, so the
-- sole way to gain XP is to do something the app validated first.
-- ---------------------------------------------------------------------------

create or replace function public.grant_xp(
  p_user_id uuid,
  p_amount smallint,
  p_reason xp_reason,
  p_source_table text default null,
  p_source_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_last_activity date;
  v_streak smallint;
begin
  if p_amount is null or p_amount <= 0 then
    return;
  end if;

  insert into xp_events (user_id, amount, reason, source_table, source_id)
  values (p_user_id, p_amount, p_reason, p_source_table, p_source_id);

  select last_activity_date, current_streak_days
  into v_last_activity, v_streak
  from user_progress
  where user_id = p_user_id
  for update;

  -- A streak day is any day the user earned XP, which avoids maintaining a
  -- separate "app was opened" ping just to keep the counter alive.
  if v_last_activity = v_today then
    null;
  elsif v_last_activity = v_today - 1 then
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  update user_progress
  set total_xp = total_xp + p_amount,
      level = greatest(1, (total_xp + p_amount) / 100 + 1),
      current_streak_days = v_streak,
      longest_streak_days = greatest(longest_streak_days, v_streak),
      last_activity_date = v_today,
      league = case
        when (total_xp + p_amount) / 100 + 1 >= 10 then 'gold'
        when (total_xp + p_amount) / 100 + 1 >= 5 then 'silver'
        else 'bronze'
      end,
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

revoke execute on function public.grant_xp(uuid, smallint, xp_reason, text, text) from public;
revoke execute on function public.grant_xp(uuid, smallint, xp_reason, text, text) from authenticated;

-- Correcting a partner's sentence is the learning loop, so both sides earn:
-- the corrector for the effort, the author for having their mistake fixed.
create or replace function public.award_correction_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  select sender_id into v_author from messages where id = new.message_id;

  perform public.grant_xp(new.corrector_id, 10::smallint, 'correction_given',
                          'message_corrections', new.id::text);

  if v_author is not null and v_author <> new.corrector_id then
    perform public.grant_xp(v_author, 5::smallint, 'correction_received',
                            'message_corrections', new.id::text);
  end if;

  return null;
end;
$$;

create trigger message_corrections_award_xp
  after insert on message_corrections
  for each row execute function public.award_correction_xp();

-- ---------------------------------------------------------------------------
-- Missions
-- ---------------------------------------------------------------------------

-- A match without a conversation starter is the problem this app exists to
-- solve, so a mission is attached in the same transaction as the match itself.
create or replace function public.assign_next_mission(p_match_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mission_id uuid;
  v_match_mission_id uuid;
begin
  select id into v_mission_id
  from missions
  where is_active and not is_daily
    and id not in (
      select mission_id from match_missions where match_id = p_match_id
    )
  order by random()
  limit 1;

  -- Once every mission has been played, start the pool over rather than
  -- leaving the pair with nothing to do.
  if v_mission_id is null then
    select id into v_mission_id
    from missions
    where is_active and not is_daily
    order by random()
    limit 1;
  end if;

  if v_mission_id is null then
    return null;
  end if;

  insert into match_missions (match_id, mission_id)
  values (p_match_id, v_mission_id)
  on conflict do nothing
  returning id into v_match_mission_id;

  if v_match_mission_id is null then
    select id into v_match_mission_id
    from match_missions
    where match_id = p_match_id and status = 'active'
    limit 1;
  end if;

  return v_match_mission_id;
end;
$$;

revoke execute on function public.assign_next_mission(uuid) from public;
revoke execute on function public.assign_next_mission(uuid) from authenticated;

create or replace function public.advance_match_mission(p_match_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_mm record;
  v_mission record;
  v_completed boolean := false;
  v_match record;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_mm from match_missions where id = p_match_mission_id for update;
  if v_mm is null or v_mm.status <> 'active' then
    raise exception 'Mission is not active' using errcode = 'check_violation';
  end if;

  select * into v_match from matches where id = v_mm.match_id;
  if v_uid not in (v_match.user_a, v_match.user_b) then
    raise exception 'Not a member of this match' using errcode = '42501';
  end if;

  select * into v_mission from missions where id = v_mm.mission_id;

  update match_missions
  set steps_completed = least(steps_completed + 1, v_mission.target_steps)
  where id = p_match_mission_id
  returning * into v_mm;

  perform public.grant_xp(v_uid, v_mission.xp_reward_per_step, 'mission_completed',
                          'match_missions', p_match_mission_id::text);

  if v_mm.steps_completed >= v_mission.target_steps then
    update match_missions
    set status = 'completed', completed_at = now()
    where id = p_match_mission_id;
    v_completed := true;
    perform public.assign_next_mission(v_mm.match_id);
  end if;

  return jsonb_build_object(
    'steps_completed', v_mm.steps_completed,
    'target_steps', v_mission.target_steps,
    'mission_completed', v_completed,
    'xp_awarded', v_mission.xp_reward_per_step
  );
end;
$$;

grant execute on function public.advance_match_mission(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Swipe and match
-- ---------------------------------------------------------------------------

-- One round trip, one transaction. The unique constraint on matches is what
-- makes this safe when both people swipe at the same instant: both statements
-- run, exactly one insert survives, and the loser reads back the winner's row
-- instead of erroring or creating a duplicate.
create or replace function public.record_swipe(p_swipee_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reverse_like boolean;
  v_match_id uuid;
  v_user_a uuid;
  v_user_b uuid;
  v_created boolean := false;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_swipee_id = v_uid then
    raise exception 'Cannot swipe on yourself' using errcode = 'check_violation';
  end if;

  if p_action not in ('like', 'pass') then
    raise exception 'Invalid swipe action' using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from blocks
    where (blocker_id = v_uid and blocked_id = p_swipee_id)
       or (blocker_id = p_swipee_id and blocked_id = v_uid)
  ) then
    raise exception 'Unavailable' using errcode = '42501';
  end if;

  if not exists (
    select 1 from profiles
    where id = p_swipee_id
      and account_status = 'active'
      and onboarding_completed_at is not null
  ) then
    raise exception 'Profile unavailable' using errcode = 'check_violation';
  end if;

  insert into swipes (swiper_id, swipee_id, action)
  values (v_uid, p_swipee_id, p_action)
  on conflict (swiper_id, swipee_id)
  do update set action = excluded.action, created_at = now();

  if p_action <> 'like' then
    return jsonb_build_object('matched', false, 'match_id', null);
  end if;

  -- Uses the same (swiper_id, swipee_id) unique index as the insert above.
  select exists (
    select 1 from swipes
    where swiper_id = p_swipee_id
      and swipee_id = v_uid
      and action = 'like'
  ) into v_reverse_like;

  if not v_reverse_like then
    return jsonb_build_object('matched', false, 'match_id', null);
  end if;

  v_user_a := least(v_uid, p_swipee_id);
  v_user_b := greatest(v_uid, p_swipee_id);

  insert into matches (user_a, user_b)
  values (v_user_a, v_user_b)
  on conflict (user_a, user_b) do nothing
  returning id into v_match_id;

  if v_match_id is null then
    select id into v_match_id
    from matches
    where user_a = v_user_a and user_b = v_user_b;
  else
    v_created := true;
  end if;

  if v_created then
    perform public.assign_next_mission(v_match_id);
  end if;

  return jsonb_build_object('matched', true, 'match_id', v_match_id, 'is_new', v_created);
end;
$$;

grant execute on function public.record_swipe(uuid, text) to authenticated;

-- Blocking has to end the conversation too, otherwise the block is cosmetic.
create or replace function public.block_user(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_target_id = v_uid then
    raise exception 'Cannot block yourself' using errcode = 'check_violation';
  end if;

  insert into blocks (blocker_id, blocked_id)
  values (v_uid, p_target_id)
  on conflict (blocker_id, blocked_id) do nothing;

  update matches
  set status = 'unmatched'
  where user_a = least(v_uid, p_target_id)
    and user_b = greatest(v_uid, p_target_id);
end;
$$;

grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.unmatch(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  update matches
  set status = 'unmatched'
  where id = p_match_id
    and v_uid in (user_a, user_b);
end;
$$;

grant execute on function public.unmatch(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Game engine
-- ---------------------------------------------------------------------------

-- Removes the answer key before content reaches the browser.
create or replace function public.strip_answer(
  p_type game_template_type,
  p_payload jsonb
)
returns jsonb
language sql
immutable
as $$
  select case p_type
    when 'missing_word' then p_payload - 'answer'
    when 'translation_choice' then p_payload - 'answer'
    when 'word_order' then p_payload - 'answer'
    else p_payload
  end;
$$;

-- Content is chosen for the caller's target language and level, so the client
-- never names the row it is about to be graded against.
create or replace function public.start_game_session(
  p_game_template_id smallint,
  p_match_id uuid default null,
  p_match_mission_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_template record;
  v_lang record;
  v_content record;
  v_session_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_template
  from game_templates where id = p_game_template_id and is_active;
  if v_template is null then
    raise exception 'Unknown game template' using errcode = 'check_violation';
  end if;

  if p_match_id is not null and not exists (
    select 1 from matches
    where id = p_match_id and status = 'active' and v_uid in (user_a, user_b)
  ) then
    raise exception 'Not a member of this match' using errcode = '42501';
  end if;

  select language_code, cefr_level into v_lang
  from user_languages
  where user_id = v_uid and role = 'learning'
  limit 1;

  if v_lang is null then
    raise exception 'No learning language set' using errcode = 'check_violation';
  end if;

  -- Prefer content at the learner's level, fall back to anything in the
  -- language so a sparse content library never dead-ends the user.
  select * into v_content
  from game_content
  where game_template_id = p_game_template_id
    and language_code = v_lang.language_code
    and is_active
  order by (cefr_level = v_lang.cefr_level) desc, random()
  limit 1;

  insert into game_sessions (
    game_template_id, game_content_id, match_id, match_mission_id, initiator_id
  )
  values (
    p_game_template_id, v_content.id, p_match_id, p_match_mission_id, v_uid
  )
  returning id into v_session_id;

  return jsonb_build_object(
    'session_id', v_session_id,
    'template', jsonb_build_object(
      'id', v_template.id,
      'key', v_template.key,
      'type', v_template.type,
      'title', v_template.title,
      'description', v_template.description,
      'instructions', v_template.instructions,
      'is_gradable', v_template.is_gradable,
      'xp_reward', v_template.default_xp_reward
    ),
    'content', case
      when v_content.id is null then null
      else jsonb_build_object(
        'id', v_content.id,
        'language_code', v_content.language_code,
        'cefr_level', v_content.cefr_level,
        -- The answer key is stripped here; grading happens server-side.
        'payload', public.strip_answer(v_template.type, v_content.payload)
      )
    end
  );
end;
$$;

grant execute on function public.start_game_session(smallint, uuid, uuid) to authenticated;

-- The client sends what the user chose, never whether it was right.
create or replace function public.complete_game_session(
  p_session_id uuid,
  p_answer jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_session record;
  v_template record;
  v_payload jsonb;
  v_correct boolean := null;
  v_expected text := null;
  v_given text;
  v_xp smallint := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_session from game_sessions where id = p_session_id for update;
  if v_session is null or v_session.initiator_id <> v_uid then
    raise exception 'Session not found' using errcode = '42501';
  end if;

  if v_session.status <> 'in_progress' then
    return jsonb_build_object(
      'already_completed', true,
      'is_correct', v_session.is_correct,
      'xp_awarded', 0
    );
  end if;

  select * into v_template from game_templates where id = v_session.game_template_id;
  select payload into v_payload from game_content where id = v_session.game_content_id;

  if v_template.is_gradable and v_payload is not null then
    v_expected := v_payload ->> 'answer';
    v_given := p_answer ->> 'answer';
    v_correct := v_expected is not null
                 and lower(btrim(coalesce(v_given, ''))) = lower(btrim(v_expected));
    if v_correct then
      v_xp := v_template.default_xp_reward;
    end if;
  else
    -- Free-text practice cannot be machine-checked without an AI service, so
    -- completion is self-reported and deliberately worth less.
    v_correct := null;
    v_xp := v_template.default_xp_reward;
  end if;

  update game_sessions
  set status = 'completed',
      state = p_answer,
      is_correct = v_correct,
      xp_awarded = v_xp,
      completed_at = now()
  where id = p_session_id;

  if v_xp > 0 then
    perform public.grant_xp(v_uid, v_xp, 'game_session_completed',
                            'game_sessions', p_session_id::text);
  end if;

  -- Only advance a mission that is still running. Without this guard, finishing
  -- a challenge attached to an already-completed mission would raise and roll
  -- back the XP that was just legitimately earned.
  if v_session.match_mission_id is not null and exists (
    select 1 from match_missions
    where id = v_session.match_mission_id and status = 'active'
  ) then
    perform public.advance_match_mission(v_session.match_mission_id);
  end if;

  return jsonb_build_object(
    'already_completed', false,
    'is_correct', v_correct,
    'correct_answer', v_expected,
    'xp_awarded', v_xp
  );
end;
$$;

grant execute on function public.complete_game_session(uuid, jsonb) to authenticated;
