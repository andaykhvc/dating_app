-- Who gets a push (issue #24): the rules live in get_push_targets(). Rolled back afterwards.
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
  ('f4000000-0000-0000-0000-00000000000a', '{"first_name":"Alice"}'),
  ('f4000000-0000-0000-0000-00000000000b', '{"first_name":"Bruno"}'),
  ('f4000000-0000-0000-0000-00000000000c', '{"first_name":"Carla"}');
insert into public.push_tokens (user_id, token) values
  ('f4000000-0000-0000-0000-00000000000a', 'token-a1-aaaaaaaaaaaaaaaaaaaaaaaaa'),
  ('f4000000-0000-0000-0000-00000000000b', 'token-b1-bbbbbbbbbbbbbbbbbbbbbbbbb'),
  ('f4000000-0000-0000-0000-00000000000b', 'token-b2-bbbbbbbbbbbbbbbbbbbbbbbbb'),
  ('f4000000-0000-0000-0000-00000000000c', 'token-c1-ccccccccccccccccccccccccc');
-- A-B active match, A-C match that will be blocked.
insert into public.matches (id, user_a, user_b) values
  ('a4000000-0000-0000-0000-0000000000ab', 'f4000000-0000-0000-0000-00000000000a', 'f4000000-0000-0000-0000-00000000000b'),
  ('a4000000-0000-0000-0000-0000000000ac', 'f4000000-0000-0000-0000-00000000000a', 'f4000000-0000-0000-0000-00000000000c');
insert into public.messages (id, match_id, sender_id, body) overriding system value values
  (9001, 'a4000000-0000-0000-0000-0000000000ab', 'f4000000-0000-0000-0000-00000000000a', 'SECRET message text'),
  (9002, 'a4000000-0000-0000-0000-0000000000ac', 'f4000000-0000-0000-0000-00000000000a', 'to carla');

do $$
declare
  r jsonb;
begin
  -- A -> B: only B, with both of B's tokens, never A (the sender).
  r := public.get_push_targets('message', '9001');
  perform pg_temp.check(jsonb_array_length(r -> 'targets') = 1, 'one recipient');
  perform pg_temp.check(r #>> '{targets,0,user_id}' = 'f4000000-0000-0000-0000-00000000000b', 'the recipient is the other person, not the sender');
  perform pg_temp.check(jsonb_array_length(r #> '{targets,0,tokens}') = 2, 'all of the recipient''s tokens');
  perform pg_temp.check(r #>> '{targets,0,sender_first_name}' = 'Alice', 'the sender''s first name is available for the title');
  perform pg_temp.check(r::text not like '%SECRET%', 'no message content in the targets');
  perform pg_temp.check(not (r::text like '%token-a1%'), 'the sender''s tokens are not included');

  -- Blocked pair: nothing, in either direction.
  insert into public.blocks (blocker_id, blocked_id)
  values ('f4000000-0000-0000-0000-00000000000c', 'f4000000-0000-0000-0000-00000000000a');
  perform pg_temp.check(jsonb_array_length(public.get_push_targets('message', '9002') -> 'targets') = 0,
    'a blocked pair gets no push');

  -- Ended match: nothing.
  update public.matches set status = 'unmatched' where id = 'a4000000-0000-0000-0000-0000000000ab';
  perform pg_temp.check(jsonb_array_length(public.get_push_targets('message', '9001') -> 'targets') = 0,
    'an unmatched pair gets no push');
  update public.matches set status = 'active' where id = 'a4000000-0000-0000-0000-0000000000ab';

  -- A recipient without tokens: nothing to send.
  delete from public.push_tokens where user_id = 'f4000000-0000-0000-0000-00000000000b';
  perform pg_temp.check(jsonb_array_length(public.get_push_targets('message', '9001') -> 'targets') = 0,
    'no tokens, no targets');
  insert into public.push_tokens (user_id, token) values
    ('f4000000-0000-0000-0000-00000000000b', 'token-b3-bbbbbbbbbbbbbbbbbbbbbbbbb');

  -- Match pushes: both sides, except the person who just matched.
  insert into public.push_tokens (user_id, token)
  values ('f4000000-0000-0000-0000-00000000000a', 'token-a2-aaaaaaaaaaaaaaaaaaaaaaaaa');
  r := public.get_push_targets('match', 'a4000000-0000-0000-0000-0000000000ab');
  perform pg_temp.check(jsonb_array_length(r -> 'targets') = 2, 'a new match notifies both sides by default');
  r := public.get_push_targets('match', 'a4000000-0000-0000-0000-0000000000ab', 'f4000000-0000-0000-0000-00000000000a');
  perform pg_temp.check(
    jsonb_array_length(r -> 'targets') = 1 and r #>> '{targets,0,user_id}' = 'f4000000-0000-0000-0000-00000000000b',
    'the person who completed the match is not notified');

  perform pg_temp.check(public.get_push_targets('message', '424242') = '{"targets": []}'::jsonb, 'unknown message: nothing');
  perform pg_temp.raises($q$select public.get_push_targets('bogus', '1')$q$, '22023', 'unknown kinds are rejected');

  -- Inserting messages and matches works with no webhook configured.
  insert into public.messages (match_id, sender_id, body)
  values ('a4000000-0000-0000-0000-0000000000ab', 'f4000000-0000-0000-0000-00000000000b', 'works without a webhook');

  raise warning '✓ push targets passed';
end;
$$;

-- Not callable by API roles.
select set_config('request.jwt.claim.sub', 'f4000000-0000-0000-0000-00000000000a', true);
set local role authenticated;
do $$
begin
  perform pg_temp.raises($q$select public.get_push_targets('message', '9001')$q$, '42501', 'clients cannot ask who to notify');
  perform pg_temp.raises($q$select * from public.push_settings$q$, '42501', 'clients cannot read the webhook secret');
  raise warning '✓ push permissions passed';
end;
$$;

rollback;
