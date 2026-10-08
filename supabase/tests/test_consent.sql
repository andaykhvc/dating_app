-- Consent records and the dating-intention rule (issue #42). Rolled back afterwards.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

-- Fails the check unless the statement raises the given SQLSTATE.
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
  ('a2000000-0000-0000-0000-000000000001', '{"first_name":"Form","is_18_plus_confirmed":true,"terms_version":"2026-01-01","privacy_version":"2026-01-02"}'),
  ('a2000000-0000-0000-0000-000000000002', '{"first_name":"Oauth"}');

do $$
begin
  perform pg_temp.check(
    (select terms_version = '2026-01-01' and privacy_version = '2026-01-02'
            and terms_accepted_at is not null and privacy_accepted_at is not null
     from public.profiles where id = 'a2000000-0000-0000-0000-000000000001'),
    'signup metadata is stored with a timestamp');
  perform pg_temp.check(
    (select terms_accepted_at is null and terms_version is null and privacy_accepted_at is null
     from public.profiles where id = 'a2000000-0000-0000-0000-000000000002'),
    'a signup without versions (OAuth) has no acceptance on file');
end;
$$;

-- As the OAuth user ---------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-000000000002', true);
set local role authenticated;

do $$
begin
  -- No direct writes to consent evidence.
  perform pg_temp.raises(
    $q$update public.profiles set terms_accepted_at = now(), terms_version = 'x' where id = auth.uid()$q$,
    '42501', 'clients cannot write terms columns directly');

  perform public.accept_legal_terms('2026-06-01', '2026-06-02');
  perform pg_temp.check(
    (select terms_version = '2026-06-01' and privacy_version = '2026-06-02' and terms_accepted_at is not null
     from public.profiles where id = auth.uid()),
    'accept_legal_terms stores versions and time');
  perform pg_temp.raises($q$select public.accept_legal_terms('', 'x')$q$, '23514', 'empty version rejected');

  -- Dating intention needs consent --------------------------------------------------
  perform pg_temp.raises(
    $q$update public.profiles set intentions = array['language_buddy','open_to_dating']::public.intention_type[] where id = auth.uid()$q$,
    '23514', 'dating intention without consent is rejected');

  update public.profiles
  set intentions = array['language_buddy','open_to_dating']::public.intention_type[],
      dating_consent_at = timestamptz '2000-01-01'
  where id = auth.uid();
  perform pg_temp.check(
    (select dating_consent_at > now() - interval '1 minute' from public.profiles where id = auth.uid()),
    'the server stamps the consent time itself');

  -- Unrelated edits keep the original consent time.
  update public.profiles set bio = 'hello', dating_consent_at = now() + interval '1 day' where id = auth.uid();
  perform pg_temp.check(
    (select dating_consent_at < now() + interval '1 minute' from public.profiles where id = auth.uid()),
    'consent time cannot be moved by a later edit');

  -- Removing the intention clears the consent.
  update public.profiles
  set intentions = array['language_buddy']::public.intention_type[]
  where id = auth.uid();
  perform pg_temp.check(
    (select dating_consent_at is null from public.profiles where id = auth.uid()),
    'unselecting dating clears the consent');
  perform pg_temp.raises(
    $q$update public.profiles set intentions = array['open_to_dating']::public.intention_type[] where id = auth.uid()$q$,
    '23514', 're-adding dating needs fresh consent');

  raise warning '✓ consent checks (client) passed';
end;
$$;

-- Evidence cannot be erased or back-dated, even by a privileged writer ----------------
reset role;
do $$
begin
  perform pg_temp.raises(
    $q$update public.profiles set terms_accepted_at = null where id = 'a2000000-0000-0000-0000-000000000002'$q$,
    '23514', 'terms timestamp cannot be nulled');
  perform pg_temp.raises(
    $q$update public.profiles set privacy_accepted_at = timestamptz '2000-01-01' where id = 'a2000000-0000-0000-0000-000000000002'$q$,
    '23514', 'privacy timestamp cannot be back-dated');
  update public.profiles set terms_accepted_at = now() + interval '1 minute'
  where id = 'a2000000-0000-0000-0000-000000000002';
  raise warning '✓ consent checks (evidence) passed';
end;
$$;

rollback;
