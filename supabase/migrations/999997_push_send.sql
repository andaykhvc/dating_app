-- 999997_push_send.sql
-- Sending web push for new messages and new matches (issue #24).
--
-- Approach: plain triggers + pg_net, not Supabase Database Webhooks. The
-- webhooks UI stores its configuration outside the repo; triggers live in
-- migrations, are reviewed in PRs, run in the same tests, and let us decide in
-- SQL (auth.uid() at match time) who should be told. They call the send-push Edge
-- Function with a shared secret and ONLY an id: the function asks
-- get_push_targets() who to notify, so the decision rules are in one tested place
-- and no message text ever leaves the database.
--
-- With no settings row (or no pg_net, e.g. the local test database) the triggers
-- do nothing and the app works exactly as before.

create table public.push_settings (
  key text primary key check (key in ('webhook_url', 'webhook_secret')),
  value text not null
);
alter table public.push_settings enable row level security;
revoke all on public.push_settings from public, anon, authenticated;

do $$
begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net not available (%): push notifications will not be triggered', sqlerrm;
end;
$$;

-- Who should be told, and how to address them. Never returns message text.
-- p_exclude_user: someone to leave out (the person who just made the match).
create or replace function public.get_push_targets(p_kind text, p_id text, p_exclude_user uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match matches%rowtype;
  v_sender uuid;
  v_sender_name text;
  v_recipient uuid;
  v_recipients uuid[];
  v_out jsonb := '[]'::jsonb;
  v_user uuid;
begin
  if p_kind = 'message' then
    select m.* into v_match
    from messages msg join matches m on m.id = msg.match_id
    where msg.id = p_id::bigint;
    select sender_id into v_sender from messages where id = p_id::bigint;
    if v_match.id is null or v_sender is null then
      return jsonb_build_object('targets', '[]'::jsonb);
    end if;
    v_recipient := case when v_match.user_a = v_sender then v_match.user_b else v_match.user_a end;
    v_recipients := array[v_recipient];
    select first_name into v_sender_name from profiles where id = v_sender;
  elsif p_kind = 'match' then
    select * into v_match from matches where id = p_id::uuid;
    if v_match.id is null then
      return jsonb_build_object('targets', '[]'::jsonb);
    end if;
    v_recipients := array[v_match.user_a, v_match.user_b];
  else
    raise exception 'Unknown push kind %', p_kind using errcode = 'invalid_parameter_value';
  end if;

  -- Nobody is notified about a match that has ended, or by someone they have
  -- blocked / who blocked them.
  if v_match.status <> 'active' then
    return jsonb_build_object('targets', '[]'::jsonb);
  end if;

  foreach v_user in array v_recipients loop
    if v_user = v_sender or v_user = p_exclude_user then
      continue;
    end if;
    if exists (
      select 1 from blocks b
      where (b.blocker_id = v_match.user_a and b.blocked_id = v_match.user_b)
         or (b.blocker_id = v_match.user_b and b.blocked_id = v_match.user_a)
    ) then
      continue;
    end if;
    if not exists (select 1 from profiles where id = v_user and account_status = 'active') then
      continue;
    end if;
    if not exists (select 1 from push_tokens where user_id = v_user) then
      continue;
    end if;

    v_out := v_out || jsonb_build_object(
      'user_id', v_user,
      'kind', p_kind,
      'match_id', v_match.id,
      'sender_first_name', v_sender_name,
      'tokens', (select jsonb_agg(token) from push_tokens where user_id = v_user)
    );
  end loop;

  return jsonb_build_object('targets', v_out);
end;
$$;

revoke execute on function public.get_push_targets(text, text, uuid) from public, anon, authenticated;

create or replace function public.send_push_webhook(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_secret text;
begin
  select value into v_url from push_settings where key = 'webhook_url';
  select value into v_secret from push_settings where key = 'webhook_secret';
  if v_url is null or v_secret is null
     or to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    return;
  end if;

  -- Fire and forget: a failed notification must never fail a message or a swipe.
  begin
    execute 'select net.http_post(url := $1, body := $2, headers := $3, timeout_milliseconds := 5000)'
      using v_url,
            p_payload,
            jsonb_build_object('content-type', 'application/json', 'x-webhook-secret', v_secret);
  exception when others then
    raise warning 'push webhook failed: %', sqlerrm;
  end;
end;
$$;

revoke execute on function public.send_push_webhook(jsonb) from public, anon, authenticated;

create or replace function public.request_push_for_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.send_push_webhook(jsonb_build_object('kind', 'message', 'id', new.id::text));
  return null;
end;
$$;

create or replace function public.request_push_for_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Inside record_swipe the caller is the person who just completed the match;
  -- they already see the celebration, so only the other person is notified.
  perform public.send_push_webhook(jsonb_build_object(
    'kind', 'match', 'id', new.id::text, 'exclude_user', auth.uid()));
  return null;
end;
$$;

revoke execute on function public.request_push_for_message() from public, anon, authenticated;
revoke execute on function public.request_push_for_match() from public, anon, authenticated;

create trigger messages_request_push
  after insert on public.messages
  for each row execute function public.request_push_for_message();

create trigger matches_request_push
  after insert on public.matches
  for each row execute function public.request_push_for_match();
