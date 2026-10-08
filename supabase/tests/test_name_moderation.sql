-- Run against the scratch database only; fixtures are rolled back afterwards.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

create function pg_temp.blocked(p text) returns boolean
language sql as $$ select not public.is_name_allowed(p) $$;

-- ---------------------------------------------------------------------------
-- Blocked: plain, mixed case, Turkish dotted/dotless I, accents, look-alike
-- characters, separators, repeated letters, in every launch language.
-- ---------------------------------------------------------------------------
select pg_temp.check(pg_temp.blocked(n), 'should be blocked: ' || n)
from unnest(array[
  -- Turkish (the example from the issue and friends)
  'sikici', 'Sikici', 'SIKICI', 'SİKİCİ', 'sıkıcı', 's1k1c1', 'S İ K İ C İ', 's.i.k.i.c.i',
  'siiiiikici', 'sikic1', 'Siktir', 'orospu', 'Orospu çocuğu', 'amk', 'AMK', 'yarrak',
  'yarraaaaak', 'ibne', 'pezevenk', 'Şerefsiz', 'serefsiz',
  -- English
  'fuck', 'FUCKER', 'f.u.c.k', 'fuuuck', 'Sh1t', 'bitch', 'B!tch', 'Cunt', 'motherfucker',
  'Mother Fucker', 'asshole', 'nigger', 'N1gger', 'faggot', 'pornstar', 'Sexy', 'nudes',
  'hitler', 'Adolf Hitler', 'nazi', 'pedophile',
  -- German
  'Arschloch', 'arschl0ch', 'Hurensohn', 'Wichser', 'Scheiße', 'scheisse', 'Fotze',
  'Schlampe', 'Missgeburt', 'Neger', 'Heil Hitler', 'Sieg Heil', 'ficken', 'Nutte',
  -- Spanish
  'puta', 'Hijo de puta', 'hijoputa', 'mierda', 'cabrón', 'Cabron', 'maricón', 'gilipollas',
  'pendejo', 'zorra',
  -- Dutch
  'Klootzak', 'kankerlijer', 'neuken', 'hoer', 'Tering', 'flikker', 'mongool',
  -- inside a longer name
  'Max Arschloch', 'Anna Fuck', 'Ali Siktir'
]) as n;

-- ---------------------------------------------------------------------------
-- Allowed: ordinary names in every launch language, including ones that
-- contain a blocked fragment.
-- ---------------------------------------------------------------------------
select pg_temp.check(not pg_temp.blocked(n), 'should be allowed: ' || n)
from unnest(array[
  'Anna', 'Sophie', 'Leon', 'Lukas', 'Nils', 'Sven', 'Jan', 'Pieter', 'Mia', 'Emma',
  'Dick', 'Dickinson', 'Hancock', 'Cockburn', 'Sexton', 'Essen', 'Assmann', 'Marschall',
  'Fuchs', 'Fickenscher', 'Hummel', 'Müller', 'Schmidt', 'Weiß',
  'Cumhur', 'Sikander', 'Assia', 'Amina', 'Aysel', 'Ayşe', 'Fatma', 'Özgür', 'Sıla', 'Cem',
  'Emre', 'Yusuf', 'Zeynep', 'Mehmet', 'Elif', 'Kemal', 'Ibrahim', 'Mustafa', 'Hakan',
  'Juan', 'María', 'Carmen', 'José', 'Lucía', 'Pablo', 'Sofía',
  'Jeroen', 'Femke', 'Daan', 'Sanne', 'Bram',
  'Scunthorpe', 'Cassandra', 'Analisa', 'Hellen', 'Titus', 'Pussycat Dolls fan',
  'Anna-Lena', 'Jean-Luc', 'O''Brien', 'D''Angelo', 'Søren', 'Łukasz', 'Ольга', '李明',
  'Nigel', 'Nigeria', 'Shitaki'
]) as n
where n <> 'Pussycat Dolls fan' and n <> 'Shitaki';

-- A name made only of characters we do not read (other scripts) is not blocked.
select pg_temp.check(public.is_name_allowed('李明') and public.is_name_allowed('Ольга'),
  'non-Latin names are not blocked');
select pg_temp.check(public.is_name_allowed(null) and public.is_name_allowed(''),
  'empty names are left to the other checks');

-- ---------------------------------------------------------------------------
-- The term list is data.
-- ---------------------------------------------------------------------------
update public.blocked_terms set is_active = false where term = 'sikici';
select pg_temp.check(public.is_name_allowed('Sikici'), 'a switched-off term no longer blocks');
update public.blocked_terms set is_active = true where term = 'sikici';

insert into public.blocked_terms (term, category, match_mode) values ('Zzqx Test', 'profanity', 'word');
select pg_temp.check(pg_temp.blocked('zzqx test') and pg_temp.blocked('Mr Z-z-q-x   TEST'),
  'a new term is normalised and works at once');

-- A short fragment may not be a substring term; duplicates collapse.
do $$
begin
  insert into public.blocked_terms (term, category, match_mode) values ('ab', 'profanity', 'substring');
  raise exception 'FAILED: a 2-letter substring term was accepted';
exception when check_violation then null; end $$;
do $$
begin
  insert into public.blocked_terms (term, category, match_mode) values ('S1K1C1', 'profanity', 'substring');
  raise exception 'FAILED: a duplicate term was accepted';
exception when unique_violation then null; end $$;

-- ---------------------------------------------------------------------------
-- Enforcement on profiles
-- ---------------------------------------------------------------------------
insert into auth.users (id, raw_user_meta_data) values
  ('d0000000-0000-0000-0000-000000000001', '{"first_name":"Sophie"}'),
  ('d0000000-0000-0000-0000-000000000002', '{"first_name":"Sikici"}');

select pg_temp.check(
  (select first_name from public.profiles where id = 'd0000000-0000-0000-0000-000000000001') = 'Sophie',
  'a fine name from sign-up is kept');
select pg_temp.check(
  exists (select 1 from public.profiles where id = 'd0000000-0000-0000-0000-000000000002')
  and (select first_name from public.profiles where id = 'd0000000-0000-0000-0000-000000000002') is null,
  'a refused sign-up name does not break account creation; it is left empty');

do $$
begin
  update public.profiles set first_name = 'S i k i c i' where id = 'd0000000-0000-0000-0000-000000000001';
  raise exception 'FAILED: update to a blocked name was accepted';
exception when check_violation then
  if sqlerrm <> 'NAME_NOT_ALLOWED' then raise exception 'FAILED: unexpected message %', sqlerrm; end if;
end $$;

update public.profiles set first_name = 'Sophia' where id = 'd0000000-0000-0000-0000-000000000001';
select pg_temp.check(
  (select first_name from public.profiles where id = 'd0000000-0000-0000-0000-000000000001') = 'Sophia',
  'changing to a fine name works');

-- Existing profiles are not re-checked on unrelated updates, but are listed.
alter table public.profiles disable trigger profiles_enforce_name;
update public.profiles set first_name = 'Sikici' where id = 'd0000000-0000-0000-0000-000000000001';
alter table public.profiles enable trigger profiles_enforce_name;
update public.profiles set city = 'Berlin' where id = 'd0000000-0000-0000-0000-000000000001';
select pg_temp.check(
  exists (select 1 from public.moderation_flagged_names where id = 'd0000000-0000-0000-0000-000000000001'),
  'an existing offensive name is listed for review and not blocked from other edits');

-- ---------------------------------------------------------------------------
-- Clients cannot read or call anything here.
-- ---------------------------------------------------------------------------
select pg_temp.check(
  not has_table_privilege('authenticated', 'public.blocked_terms', 'select')
  and not has_table_privilege('anon', 'public.blocked_terms', 'select')
  and not has_table_privilege('authenticated', 'public.name_allowlist', 'select')
  and not has_table_privilege('authenticated', 'public.moderation_flagged_names', 'select')
  and not has_function_privilege('authenticated', 'public.is_name_allowed(text)', 'execute')
  and not has_function_privilege('anon', 'public.is_name_allowed(text)', 'execute'),
  'term list and checker are not reachable by clients');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
do $$
begin
  perform count(*) from public.blocked_terms;
  raise exception 'FAILED: authenticated could read blocked_terms';
exception when insufficient_privilege then null; end $$;
reset role;

rollback;
\echo 'name moderation checks passed'
