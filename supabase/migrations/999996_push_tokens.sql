-- 999996_push_tokens.sql
-- Device tokens for web push (issue #23). Sending is a separate step (#24).
--
-- Clients may read and delete only their own rows. They register a device
-- through register_push_token() rather than inserting directly: a token
-- identifies a *device*, so when a different person signs in on the same
-- browser the row must move to them, which a plain insert (unique token) or an
-- update policy could not do safely.

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique check (char_length(token) between 20 and 4096),
  platform text not null default 'web' check (platform in ('web', 'android', 'ios')),
  user_agent text check (char_length(user_agent) <= 400),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy push_tokens_select_own on public.push_tokens
  for select to authenticated using (user_id = auth.uid());
create policy push_tokens_delete_own on public.push_tokens
  for delete to authenticated using (user_id = auth.uid());

-- Narrow the default table grants to what the policies allow.
revoke all on public.push_tokens from public, anon, authenticated;
grant select, delete on public.push_tokens to authenticated;

create or replace function public.register_push_token(
  p_token text,
  p_platform text default 'web',
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  insert into push_tokens (user_id, token, platform, user_agent)
  values (auth.uid(), p_token, p_platform, left(p_user_agent, 400))
  on conflict (token) do update
    set user_id = auth.uid(),
        platform = excluded.platform,
        user_agent = excluded.user_agent,
        last_seen_at = now();
end;
$$;

revoke execute on function public.register_push_token(text, text, text) from public, anon;
grant execute on function public.register_push_token(text, text, text) to authenticated;
