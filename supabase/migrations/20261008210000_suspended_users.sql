-- 20261008210000_suspended_users.sql
-- Makes "suspended" real, and gives the owner a simple way to act on reports.
--
-- Until now profiles.account_status = 'suspended' only hid the person from
-- other people's Discover feed. A suspended user could still swipe, match and
-- send messages in conversations that were already open. Now:
--   * a suspended/deleted user cannot swipe (record_swipe);
--   * chats with a suspended/deleted person end (a trigger sets their active
--     matches to 'unmatched'), and no message or correction can be sent in a
--     chat where either side is not active;
--   * the app shows a "suspended" screen instead of the app (see the layout).
--
-- Version note: this file uses a timestamp version because the legacy 9999x
-- numbering has run out of room (any later number sorts before 99992 as
-- text). scripts/db/deploy.sh pushes with --include-all for that reason.

create or replace function public.is_active_user(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = p_uid and account_status = 'active'
  );
$$;

revoke execute on function public.is_active_user(uuid) from public, anon, authenticated;

-- Both people must be active for a chat to accept anything new.
create or replace function public.is_active_match_member(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from matches m
    join profiles a on a.id = m.user_a
    join profiles b on b.id = m.user_b
    where m.id = p_match_id
      and m.status = 'active'
      and auth.uid() in (m.user_a, m.user_b)
      and a.account_status = 'active'
      and b.account_status = 'active'
  );
$$;

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
    join profiles a on a.id = mt.user_a
    join profiles b on b.id = mt.user_b
    where m.id = p_message_id
      and m.sender_id <> auth.uid()
      and mt.status = 'active'
      and auth.uid() in (mt.user_a, mt.user_b)
      and a.account_status = 'active'
      and b.account_status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- Swiping
-- ---------------------------------------------------------------------------
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

  -- A suspended or deleted account cannot take part any more.
  if not public.is_active_user(v_uid) then
    raise exception 'Account unavailable' using errcode = '42501';
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


-- ---------------------------------------------------------------------------
-- Suspending or deleting someone ends their conversations.
-- ---------------------------------------------------------------------------
create or replace function public.end_matches_of_unavailable_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_status <> 'active' and old.account_status = 'active' then
    update matches
    set status = 'unmatched'
    where status = 'active' and new.id in (user_a, user_b);
  end if;
  return null;
end;
$$;

revoke execute on function public.end_matches_of_unavailable_user() from public, anon, authenticated;

create trigger profiles_end_matches_when_unavailable
  after update of account_status on profiles
  for each row execute function public.end_matches_of_unavailable_user();

-- ---------------------------------------------------------------------------
-- For the owner, in the Supabase SQL editor (see docs/moderation-runbook.md).
-- None of these can be used by the app: execute is revoked from every client role.
-- ---------------------------------------------------------------------------

-- Open reports, oldest first.
create view moderation_open_reports with (security_invoker = true) as
  select
    r.id as report_id,
    r.created_at,
    r.reason,
    r.details,
    rep.first_name as reporter_name,
    r.reporter_id,
    tgt.first_name as reported_name,
    r.reported_id,
    tgt.account_status as reported_status,
    (select count(*) from reports x where x.reported_id = r.reported_id) as times_reported,
    r.match_id
  from reports r
  join profiles rep on rep.id = r.reporter_id
  join profiles tgt on tgt.id = r.reported_id
  where r.status = 'open'
  order by (r.reason = 'underage') desc, r.created_at;

revoke all on moderation_open_reports from public, anon, authenticated;

-- The last messages of a conversation, for context when reading a report.
create or replace function public.moderation_messages(p_match_id uuid, p_limit int default 20)
returns table (sent_at timestamptz, sender text, body text)
language sql
stable
set search_path = public
as $$
  select * from (
    select m.created_at, p.first_name, m.body
    from messages m join profiles p on p.id = m.sender_id
    where m.match_id = p_match_id
    order by m.id desc
    limit greatest(1, least(p_limit, 200))
  ) recent order by 1;
$$;

revoke execute on function public.moderation_messages(uuid, int) from public, anon, authenticated;

-- Suspends someone, ends their conversations, and marks a report as handled.
create or replace function public.moderation_suspend(p_user uuid, p_report uuid default null)
returns text
language plpgsql
set search_path = public
as $$
begin
  update profiles set account_status = 'suspended' where id = p_user;
  if not found then
    raise exception 'No such user: %', p_user;
  end if;
  if p_report is not null then
    update reports set status = 'reviewed' where id = p_report;
  end if;
  return 'suspended ' || p_user;
end;
$$;

create or replace function public.moderation_reinstate(p_user uuid)
returns text
language plpgsql
set search_path = public
as $$
begin
  update profiles set account_status = 'active' where id = p_user and account_status = 'suspended';
  if not found then
    raise exception 'Nobody suspended with that id: %', p_user;
  end if;
  return 'reinstated ' || p_user || ' (their old conversations stay ended)';
end;
$$;

create or replace function public.moderation_resolve_report(p_report uuid, p_status text default 'dismissed')
returns text
language plpgsql
set search_path = public
as $$
begin
  if p_status not in ('reviewed', 'dismissed') then
    raise exception 'status must be reviewed or dismissed';
  end if;
  update reports set status = p_status where id = p_report;
  if not found then
    raise exception 'No such report: %', p_report;
  end if;
  return 'report ' || p_report || ' marked ' || p_status;
end;
$$;

revoke execute on function public.moderation_suspend(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.moderation_reinstate(uuid) from public, anon, authenticated;
revoke execute on function public.moderation_resolve_report(uuid, text) from public, anon, authenticated;
