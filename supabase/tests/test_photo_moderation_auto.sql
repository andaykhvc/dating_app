-- Automatic photo checks, database side (issue #50). Rolled back afterwards.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

create function pg_temp.raises(sql text, expected_state text, message text) returns void
language plpgsql as $$
begin
  execute sql;
  raise exception 'FAILED (no error raised): %', message;
exception when others then
  if sqlstate = 'P0001' and sqlerrm like 'FAILED (no error raised)%' then raise; end if;
  if sqlstate <> expected_state then
    raise exception 'FAILED (got % %): %', sqlstate, sqlerrm, message;
  end if;
end;
$$;

insert into auth.users (id, raw_user_meta_data) values
  ('b2000000-0000-0000-0000-000000000001', '{"first_name":"Auto"}');
insert into public.profile_photos (id, user_id, storage_path, position) values
  ('c2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'x/a.webp', 0),
  ('c2000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'x/b.webp', 1);

do $$
declare
  p1 constant uuid := 'c2000000-0000-0000-0000-000000000001';
  p2 constant uuid := 'c2000000-0000-0000-0000-000000000002';
begin
  -- Uploads work with no webhook configured (and without pg_net).
  perform pg_temp.check(
    (select count(*) from public.profile_photos where moderation_status = 'pending') >= 2,
    'uploads stay pending when no webhook is configured');

  -- Automatic approve / reject use the same functions, source = auto.
  perform public.approve_photo(p1, 'auto');
  perform pg_temp.check(
    (select moderation_status = 'approved' and moderation_source = 'auto' from public.profile_photos where id = p1),
    'auto approval is recorded as auto');

  -- A duplicate webhook does nothing: the second approve finds nothing pending.
  perform pg_temp.raises(format($q$select public.approve_photo(%L, 'auto')$q$, p1), 'P0002', 'second approve is a no-op error');

  -- Auto rejection only applies to pending photos.
  perform pg_temp.raises(
    format($q$select public.reject_photo(%L, 'Nudity or sexual content', 'auto')$q$, p1),
    'P0002', 'auto rejection cannot override an approved photo');
  perform public.reject_photo(p2, 'Nudity or sexual content', 'auto');
  perform pg_temp.check(
    (select moderation_status = 'rejected' and moderation_source = 'auto' and moderation_reason = 'Nudity or sexual content'
     from public.profile_photos where id = p2),
    'auto rejection stores the reason');

  -- A human can still reject an approved photo.
  perform public.reject_photo(p1, 'Reported by another member');
  perform pg_temp.check(
    (select moderation_status = 'rejected' and moderation_source = 'manual' from public.profile_photos where id = p1),
    'manual rejection still works on approved photos');

  -- The event log and settings are not reachable by API roles.
  insert into public.photo_moderation_events (photo_id, user_id, mode, outcome, verdict, provider_called)
  values (p1, 'b2000000-0000-0000-0000-000000000001', 'shadow', 'shadow', 'safe', true);
  raise warning '✓ auto moderation (database) passed';
end;
$$;

select set_config('request.jwt.claim.sub', 'b2000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
begin
  perform pg_temp.raises($q$select * from public.photo_moderation_events$q$, '42501', 'clients cannot read the event log');
  perform pg_temp.raises($q$select * from public.moderation_settings$q$, '42501', 'clients cannot read the webhook secret');
  perform pg_temp.raises($q$select public.reject_photo(gen_random_uuid(), 'x', 'auto')$q$, '42501', 'clients cannot call reject_photo');
  raise warning '✓ auto moderation (permissions) passed';
end;
$$;

rollback;
