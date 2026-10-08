-- Run against the scratch database only; fixtures are rolled back afterwards.
\set ON_ERROR_STOP 1
begin;

create function pg_temp.check(ok boolean, message text) returns void
language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', message; end if;
end;
$$;

-- Full names are refused in every spelling people will try.
select pg_temp.check(not public.is_name_allowed(n), 'should be blocked: ' || n)
from unnest(array[
  'Recep Tayyip Erdoğan', 'recep tayyip erdogan', 'RECEP TAYYİP ERDOĞAN', 'Recep Tayyip Erdogan',
  'recep tayyipp erdogaaan', 'R.T. Erdoğan', 'R T Erdogan', 'Tayyip Erdoğan', 'T@yyip Erdogan',
  'Devlet Bahçeli', 'devlet bahceli', 'Kemal Kılıçdaroğlu', 'Kilicdaroglu', 'KILIÇDAROĞLU',
  'Özgür Özel', 'ozgur ozel', 'Ekrem İmamoğlu', 'ekrem imamoglu', 'Mansur Yavaş', 'Cevdet Yılmaz',
  'Müsavat Dervişoğlu', 'Tuncer Bakırhan', 'Hatimoğulları', 'Ahmet Davutoğlu', 'Ali Babacan',
  'Sayın Recep Tayyip Erdoğan', 'recep tayyip erdogan 1923'
]) as n;

-- Ordinary people who share a first name or a common surname must be fine.
select pg_temp.check(public.is_name_allowed(n), 'should be allowed: ' || n)
from unnest(array[
  'Recep', 'Tayyip', 'Erdoğan', 'Erdogan', 'Recep Erdoğan', 'Ayşe Erdoğan', 'Mehmet Erdoğan',
  'Recep Yılmaz', 'Mehmet Yılmaz', 'Ali Yılmaz', 'Cevdet', 'Yılmaz',
  'Özgür', 'Özel', 'Ayşe Özel', 'Özgür Kaya', 'Ekrem', 'İmamoğlu', 'Zeynep İmamoğlu',
  'Mansur', 'Yavaş', 'Ali', 'Babacan', 'Ali Kaya', 'Devlet', 'Bahçeli', 'Kemal', 'Mustafa Kemal',
  'Ahmet', 'Davutoğlu', 'Ahmet Kaya', 'Tuncer', 'Bakırhan', 'Müsavat', 'Dervişoğlu',
  'Tayyip Kaya', 'Recep Tayyip'
]) as n;

-- Same machinery as the rest of the filter: switch one off and it lifts.
update public.blocked_terms set is_active = false where term = 'Ali Babacan';
select pg_temp.check(public.is_name_allowed('Ali Babacan'), 'a switched-off public figure no longer blocks');
update public.blocked_terms set is_active = true where term = 'Ali Babacan';
select pg_temp.check(not public.is_name_allowed('Ali Babacan'), 'and blocks again when switched on');

-- Stored as a public_figure and not readable by clients.
select pg_temp.check(
  (select count(*) from public.blocked_terms where category = 'public_figure') >= 15,
  'the starter list is loaded');
select pg_temp.check(not has_table_privilege('authenticated', 'public.blocked_terms', 'select'),
  'the list is not readable by clients');

-- The profile trigger applies the same rule.
insert into auth.users (id, raw_user_meta_data)
values ('e0000000-0000-0000-0000-000000000001', '{"first_name":"Recep"}');
select pg_temp.check(
  (select first_name from public.profiles where id = 'e0000000-0000-0000-0000-000000000001') = 'Recep',
  'a plain first name is kept');
do $$
begin
  update public.profiles set first_name = 'Recep Tayyip Erdoğan'
  where id = 'e0000000-0000-0000-0000-000000000001';
  raise exception 'FAILED: a public figure name was accepted';
exception when check_violation then
  if sqlerrm <> 'NAME_NOT_ALLOWED' then raise exception 'FAILED: unexpected message %', sqlerrm; end if;
end $$;

rollback;
\echo 'public figure name checks passed'
