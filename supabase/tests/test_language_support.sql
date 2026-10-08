-- Run against the scratch database only; fixtures are rolled back afterwards.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

-- The flag follows the courses table (seeded: en, de, es, nl, tr).
select pg_temp.check(
  (select array_agg(code order by code) from public.languages where is_launch_language)
    = (select array_agg(language_code order by language_code) from public.courses where is_published),
  'is_launch_language matches the published courses');
select pg_temp.check(
  not (select is_launch_language from public.languages where code = 'fr'),
  'a language with no course is not fully supported');

insert into public.courses (language_code, title) values ('fr', 'French');
select pg_temp.check((select is_launch_language from public.languages where code = 'fr'),
  'adding a course turns the flag on');
update public.courses set is_published = false where language_code = 'fr';
select pg_temp.check(not (select is_launch_language from public.languages where code = 'fr'),
  'unpublishing a course turns the flag off');
update public.courses set is_published = true where language_code = 'fr';
delete from public.courses where language_code = 'fr';
select pg_temp.check(not (select is_launch_language from public.languages where code = 'fr'),
  'deleting a course turns the flag off');

-- Learning needs a supported language; speaking natively does not.
insert into auth.users (id, raw_user_meta_data)
values ('c0000000-0000-0000-0000-000000000001', '{"first_name":"Lang"}');

insert into public.user_languages (user_id, language_code, role, cefr_level)
values ('c0000000-0000-0000-0000-000000000001', 'fr', 'native', null);
select pg_temp.check(true, 'a coming-soon language can be native');

do $$
begin
  insert into public.user_languages (user_id, language_code, role, cefr_level)
  values ('c0000000-0000-0000-0000-000000000001', 'fr', 'learning', 'A1');
  raise exception 'FAILED: learning a coming-soon language was accepted';
exception when check_violation then
  null;
end $$;

insert into public.user_languages (user_id, language_code, role, cefr_level)
values ('c0000000-0000-0000-0000-000000000001', 'tr', 'learning', 'A1');

-- Switching to an unsupported language by update is refused too.
do $$
begin
  update public.user_languages set language_code = 'it'
  where user_id = 'c0000000-0000-0000-0000-000000000001' and role = 'learning';
  raise exception 'FAILED: changing to a coming-soon language was accepted';
exception when check_violation then
  null;
end $$;

-- A level change on a supported language still works, and so does the profile
-- editor's upsert of the same row.
insert into public.user_languages (user_id, language_code, role, cefr_level)
values ('c0000000-0000-0000-0000-000000000001', 'tr', 'learning', 'A1')
on conflict (user_id, language_code, role) do update set cefr_level = excluded.cefr_level;
update public.user_languages set cefr_level = 'A2'
where user_id = 'c0000000-0000-0000-0000-000000000001' and role = 'learning';
select pg_temp.check(
  (select cefr_level from public.user_languages
   where user_id = 'c0000000-0000-0000-0000-000000000001' and role = 'learning') = 'A2',
  'changing the level of a supported language still works');

-- A choice made before the rule existed is kept while unchanged.
alter table public.user_languages disable trigger user_languages_enforce_learnable;
update public.user_languages set language_code = 'it'
where user_id = 'c0000000-0000-0000-0000-000000000001' and role = 'learning';
alter table public.user_languages enable trigger user_languages_enforce_learnable;
update public.user_languages set cefr_level = 'B1'
where user_id = 'c0000000-0000-0000-0000-000000000001' and role = 'learning';
select pg_temp.check(
  (select cefr_level from public.user_languages
   where user_id = 'c0000000-0000-0000-0000-000000000001' and role = 'learning') = 'B1',
  'an existing unsupported choice is not broken by unrelated updates');

-- The trigger functions are not callable by clients.
select pg_temp.check(
  not has_function_privilege('authenticated', 'public.enforce_learnable_language()', 'execute')
  and not has_function_privilege('anon', 'public.sync_language_support()', 'execute'),
  'trigger functions are not executable by clients');

rollback;
\echo 'language support checks passed'
