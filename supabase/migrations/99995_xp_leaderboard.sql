-- Generated with `supabase migration new xp_leaderboard`, then renumbered to
-- follow this repository's legacy 9999x history (CLI sorts versions as strings).
-- Keep profiles and progress own-row-only. Expose only a shaped, read-only RPC.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.get_xp_leaderboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_uid and account_status = 'active'
      and onboarding_completed_at is not null
  ) then
    raise exception 'Complete an active profile first' using errcode = '42501';
  end if;

  with ranked as materialized (
    select p.id, p.first_name, p.primary_photo_path,
      coalesce(up.total_xp, 0) as total_xp,
      coalesce(up.level, 1) as level,
      rank() over (order by coalesce(up.total_xp, 0) desc) as rank
    from public.profiles p
    left join public.user_progress up on up.user_id = p.id
    where p.account_status = 'active'
      and p.onboarding_completed_at is not null
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = v_uid and b.blocked_id = p.id)
          or (b.blocker_id = p.id and b.blocked_id = v_uid)
      )
  ), leaders as (
    select * from ranked order by total_xp desc, id limit 50
  )
  select jsonb_build_object(
    'entries', (select coalesce(jsonb_agg(to_jsonb(l) order by l.total_xp desc, l.id), '[]'::jsonb) from leaders l),
    'current_user', (select to_jsonb(r) from ranked r where r.id = v_uid)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function private.get_xp_leaderboard() from public, anon, authenticated;
grant execute on function private.get_xp_leaderboard() to authenticated;

-- The Data API exposes public, not private. The privileged implementation stays
-- in private; this invoker wrapper cannot independently bypass any table RLS.
create or replace function public.get_xp_leaderboard()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$ select private.get_xp_leaderboard(); $$;

revoke all on function public.get_xp_leaderboard() from public, anon, authenticated;
grant execute on function public.get_xp_leaderboard() to authenticated;
