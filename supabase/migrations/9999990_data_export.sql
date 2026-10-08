-- 99998_data_export.sql
-- Support for "Download my data" (GDPR Art. 15 / 20), issue #43.
--
-- The export itself runs in the app server with the *user's own session*, so
-- row-level security decides what each table returns. Two things RLS
-- deliberately hides from clients are exposed here as narrow functions that
-- only ever return the caller's own rows:
--   * the first name of the person on the other side of each of your matches,
--   * your lesson history (lesson_sessions has no client read policy because
--     its `exercises` column holds answer keys; the export omits that column).
-- Plus a database-backed rate limit, which works on serverless where an
-- in-memory counter would be per instance.

create table public.data_export_requests (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  requested_at timestamptz not null default now()
);

alter table public.data_export_requests enable row level security;
-- No policies: not readable or writable by clients, only by the functions below.
revoke all on table public.data_export_requests from anon, authenticated;

-- Returns 0 and records the request when an export is allowed, otherwise the
-- number of seconds to wait. One atomic upsert, so two tabs cannot both pass.
create or replace function public.claim_data_export(p_min_interval interval default interval '1 minute')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_claimed uuid;
  v_last timestamptz;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  insert into data_export_requests as r (user_id, requested_at)
  values (v_uid, now())
  on conflict (user_id) do update set requested_at = now()
    where r.requested_at <= now() - p_min_interval
  returning r.user_id into v_claimed;

  if v_claimed is not null then
    return 0;
  end if;

  select requested_at into v_last from data_export_requests where user_id = v_uid;
  return greatest(1, ceil(extract(epoch from (v_last + p_min_interval - now())))::integer);
end;
$$;

create or replace function public.get_my_export_extras()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'match_partners', coalesce((
      select jsonb_agg(jsonb_build_object(
        'match_id', m.id,
        'partner_first_name', p.first_name
      ) order by m.matched_at)
      from matches m
      join profiles p on p.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
      where auth.uid() in (m.user_a, m.user_b)
    ), '[]'::jsonb),
    'lesson_sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'mode', s.mode,
        'lesson_id', s.lesson_id,
        'language_code', s.language_code,
        'known_language_code', s.known_language_code,
        'results', s.results,
        'status', s.status,
        'xp_awarded', s.xp_awarded,
        'score', s.score,
        'created_at', s.created_at,
        'completed_at', s.completed_at
      ) order by s.created_at)
      from lesson_sessions s
      where s.user_id = auth.uid()
    ), '[]'::jsonb)
  )
  where auth.uid() is not null;
$$;

revoke execute on function public.claim_data_export(interval) from public, anon;
revoke execute on function public.get_my_export_extras() from public, anon;
grant execute on function public.claim_data_export(interval) to authenticated;
grant execute on function public.get_my_export_extras() to authenticated;
