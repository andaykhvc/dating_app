-- 99997_language_support.sql
-- "Fully supported" language = one we have a published course for.
--
-- languages.is_launch_language was kept by hand, and had drifted: a fresh
-- database got nl/tr from migrations that ran *before* the seed inserted those
-- rows. It now follows `courses` automatically, and the database refuses to
-- save an unsupported language as the one someone wants to learn.

-- Keeps the flag truthful whenever a course is added, hidden or removed.
create or replace function public.sync_language_support()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  for v_code in
    select distinct c from unnest(array[
      case when tg_op in ('UPDATE', 'DELETE') then old.language_code end,
      case when tg_op in ('UPDATE', 'INSERT') then new.language_code end
    ]) as c where c is not null
  loop
    update languages l
    set is_launch_language = exists (
      select 1 from courses c where c.language_code = l.code and c.is_published
    )
    where l.code = v_code;
  end loop;
  return null;
end;
$$;

revoke execute on function public.sync_language_support() from public, anon, authenticated;

create trigger courses_sync_language_support
  after insert or update or delete on courses
  for each row execute function public.sync_language_support();

-- One-time catch-up for databases that already have courses.
update languages l
set is_launch_language = exists (
  select 1 from courses c where c.language_code = l.code and c.is_published
);

-- A language can be spoken natively without a course (it still helps matching),
-- but it can only be *learned* if there is something to learn from.
create or replace function public.enforce_learnable_language()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> 'learning' then
    return new;
  end if;

  -- Someone who already has this language saved keeps it (they chose it before
  -- the rule existed); only a new or changed choice is checked.
  if tg_op = 'UPDATE' and old.language_code = new.language_code and old.role = new.role then
    return new;
  end if;

  if not exists (
    select 1 from languages where code = new.language_code and is_launch_language
  ) then
    raise exception 'That language is coming soon and cannot be learned yet'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_learnable_language() from public, anon, authenticated;

create trigger user_languages_enforce_learnable
  before insert or update on user_languages
  for each row execute function public.enforce_learnable_language();
