-- Push token storage (issue #23). Rolled back afterwards.
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
  ('d3000000-0000-0000-0000-000000000001', '{"first_name":"Alice"}'),
  ('d3000000-0000-0000-0000-000000000002', '{"first_name":"Bruno"}');

select set_config('request.jwt.claim.sub', 'd3000000-0000-0000-0000-000000000001', true);
set local role authenticated;

do $$
begin
  perform public.register_push_token('token-alice-aaaaaaaaaaaaaaaaaaaaaaaa', 'web', 'TestBrowser/1');
  perform pg_temp.check((select count(*) from public.push_tokens) = 1, 'registering stores one row for the caller');

  -- Registering the same token again is a refresh, not a duplicate.
  perform public.register_push_token('token-alice-aaaaaaaaaaaaaaaaaaaaaaaa', 'web', 'TestBrowser/2');
  perform pg_temp.check(
    (select count(*) = 1 and bool_and(user_agent = 'TestBrowser/2') from public.push_tokens),
    're-registering updates the row');

  -- No direct writes: tokens enter only through register_push_token.
  perform pg_temp.raises(
    $q$insert into public.push_tokens (user_id, token) values (auth.uid(), 'direct-insert-xxxxxxxxxxxxxxxxxxxxxx')$q$,
    '42501', 'direct insert is denied');
  perform pg_temp.raises(
    $q$update public.push_tokens set user_id = 'd3000000-0000-0000-0000-000000000002'$q$,
    '42501', 'direct update is denied');
  perform pg_temp.raises($q$select public.register_push_token('short')$q$, '23514', 'implausibly short tokens are rejected');
  raise warning '✓ push tokens: own rows passed';
end;
$$;

-- Bruno cannot see or delete Alice's token ------------------------------------------------
select set_config('request.jwt.claim.sub', 'd3000000-0000-0000-0000-000000000002', true);
do $$
begin
  perform pg_temp.check((select count(*) from public.push_tokens) = 0, 'another user sees no tokens');
  delete from public.push_tokens;
  perform pg_temp.check(
    (select count(*) from public.push_tokens) = 0, 'delete affects only own rows (none)');
end;
$$;

reset role;
do $$
begin
  perform pg_temp.check(
    (select count(*) from public.push_tokens where user_id = 'd3000000-0000-0000-0000-000000000001') = 1,
    'Alice''s token survived Bruno''s delete');
end;
$$;

-- The same browser, a different person: the row moves to them ----------------------------
select set_config('request.jwt.claim.sub', 'd3000000-0000-0000-0000-000000000002', true);
set local role authenticated;
do $$
begin
  perform public.register_push_token('token-alice-aaaaaaaaaaaaaaaaaaaaaaaa', 'web', 'TestBrowser/3');
  perform pg_temp.check(
    (select count(*) from public.push_tokens) = 1
      and (select user_id from public.push_tokens) = auth.uid(),
    'a token registered by someone else moves to the new user');
end;
$$;
select set_config('request.jwt.claim.sub', 'd3000000-0000-0000-0000-000000000001', true);
do $$
begin
  perform pg_temp.check((select count(*) from public.push_tokens) = 0, 'the previous owner no longer has it');
  raise warning '✓ push tokens: cross-user passed';
end;
$$;

-- Own rows can be deleted; signed-out callers get nothing ----------------------------------
select set_config('request.jwt.claim.sub', 'd3000000-0000-0000-0000-000000000002', true);
do $$
begin
  delete from public.push_tokens;
  perform pg_temp.check((select count(*) from public.push_tokens) = 0, 'a user can delete their own token');
end;
$$;
reset role;
set local role anon;
do $$
begin
  perform pg_temp.raises($q$select * from public.push_tokens$q$, '42501', 'anon cannot read tokens');
  perform pg_temp.raises($q$select public.register_push_token('token-anon-aaaaaaaaaaaaaaaaaaaaaaaaaa')$q$, '42501', 'anon cannot register');
end;
$$;

rollback;
