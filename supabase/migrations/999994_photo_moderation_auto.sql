-- 999994_photo_moderation_auto.sql
-- Automatic photo checks (issue #50): the database tells the moderate-photo Edge
-- Function about every new pending photo; the function approves / rejects through
-- the same approve_photo / reject_photo as the manual path (moderation_source = 'auto').
--
-- Nothing here is required for the app: with no settings row, or the function in
-- MODERATION_MODE=off, every photo simply waits for the manual runbook.

-- One row per decision attempt: the shadow log (tuning), the per-user daily cap,
-- and an audit trail of automatic decisions. Never holds image data.
create table public.photo_moderation_events (
  id bigint generated always as identity primary key,
  photo_id uuid references public.profile_photos (id) on delete set null,
  user_id uuid references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('off', 'shadow', 'enforce')),
  outcome text not null,
  verdict text check (verdict in ('safe', 'unsafe', 'review')),
  labels jsonb not null default '[]',
  scores jsonb not null default '{}',
  error text,
  provider_called boolean not null default false,
  created_at timestamptz not null default now()
);
create index photo_moderation_events_user_idx
  on public.photo_moderation_events (user_id, created_at desc) where provider_called;
alter table public.photo_moderation_events enable row level security;
revoke all on public.photo_moderation_events from public, anon, authenticated;

-- Where to send the webhook (SQL editor / service role only).
create table public.moderation_settings (
  key text primary key check (key in ('webhook_url', 'webhook_secret')),
  value text not null
);
alter table public.moderation_settings enable row level security;
revoke all on public.moderation_settings from public, anon, authenticated;

-- Automatic decisions only ever apply to photos that are still pending, so a
-- duplicate webhook or a human who got there first wins. Manual rejection keeps
-- working on approved photos too (e.g. after a report).
create or replace function public.reject_photo(p_photo_id uuid, p_reason text, p_source text default 'manual')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  if p_source not in ('manual', 'auto') then
    raise exception 'Invalid moderation source' using errcode = 'check_violation';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required' using errcode = 'check_violation';
  end if;

  update profile_photos
  set moderation_status = 'rejected',
      moderated_at = now(),
      moderation_reason = left(trim(p_reason), 200),
      moderation_source = p_source
  where id = p_photo_id
    and (moderation_status = 'pending'
         or (p_source = 'manual' and moderation_status = 'approved'))
  returning storage_path into v_path;

  if v_path is null then
    raise exception 'Photo % was not found, is already rejected, or is not pending', p_photo_id
      using errcode = 'no_data_found';
  end if;

  return v_path;
end;
$$;

revoke execute on function public.reject_photo(uuid, text, text) from public, anon, authenticated;

-- pg_net is available on Supabase; a plain Postgres (the local test database)
-- simply does without, and the trigger below then does nothing.
do $$
begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net not available (%): automatic photo checks will not be triggered', sqlerrm;
end;
$$;

create or replace function public.request_photo_moderation()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_secret text;
begin
  if new.moderation_status <> 'pending' then
    return null;
  end if;

  select value into v_url from moderation_settings where key = 'webhook_url';
  select value into v_secret from moderation_settings where key = 'webhook_secret';
  if v_url is null or v_secret is null or to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    return null;
  end if;

  -- Fire and forget: a failure here must never block someone's upload.
  begin
    execute 'select net.http_post(url := $1, body := $2, headers := $3, timeout_milliseconds := 5000)'
      using v_url,
            jsonb_build_object('photo_id', new.id),
            jsonb_build_object('content-type', 'application/json', 'x-webhook-secret', v_secret);
  exception when others then
    raise warning 'photo moderation webhook failed: %', sqlerrm;
  end;

  return null;
end;
$$;

revoke execute on function public.request_photo_moderation() from public, anon, authenticated;

-- Covers new uploads and a replaced file (which resets the row to pending).
create trigger profile_photos_request_moderation
  after insert or update of storage_path on public.profile_photos
  for each row execute function public.request_photo_moderation();
