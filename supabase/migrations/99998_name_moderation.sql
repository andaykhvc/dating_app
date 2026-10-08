-- 99998_name_moderation.sql
-- Blocks offensive profile names, enforced in the database so a hand-made
-- request cannot get around the form.
--
-- How a name is checked
--   1. Look-alike characters are mapped (0->o 1->i 3->e 4->a 5->s 7->t @->a $->s !->i).
--   2. It is lower-cased with Turkish rules, accents are folded (ş->s, ğ->g,
--      ı/İ->i, ß->ss, ä->a ...) and anything that is not a-z becomes a space.
--   3. Single letters in a row ("f u c k") join into one word, and runs of the
--      same letter collapse to one ("siiiiik" -> "sik", "yarrak" -> "yarak").
--   4. A "word" term blocks when it equals a whole word (or a run of whole words)
--      of the name. A "substring" term (5+ letters, distinctive) blocks when it
--      appears inside the name with the separators removed, so "s.i.k.i.c.i"
--      is caught while short terms never hit the middle of an innocent name
--      (the Scunthorpe problem).
--   5. Words in name_allowlist are ignored for substring checks.
-- The term list is data, not code: add or switch off a term with SQL (see
-- docs/moderation-names.md). Clients cannot read it.

create or replace function public.moderation_words(p text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select btrim(regexp_replace(
    regexp_replace(
      -- "f u c k": single letters in a row are one word.
      regexp_replace(
        regexp_replace(
          public.learn_fold(translate(coalesce(p, ''), '@$!013457', 'asioieast')),
          '[^a-z]+', ' ', 'g'),
        '(\m[a-z]) (?=[a-z]\M)', '\1', 'g'),
      '(.)\1+', '\1', 'g'),
    '\s+', ' ', 'g'));
$$;

create table blocked_terms (
  id bigint generated always as identity primary key,
  term text not null check (char_length(btrim(term)) > 0),
  language text,
  category text not null check (category in
    ('profanity', 'slur', 'sexual', 'violence', 'hate', 'public_figure')),
  match_mode text not null default 'word' check (match_mode in ('word', 'substring')),
  is_active boolean not null default true,
  -- Filled in by the trigger below from `term`.
  term_norm text not null default '',
  created_at timestamptz not null default now(),
  check (term_norm <> ''),
  -- Short fragments would hit the middle of ordinary names.
  check (match_mode = 'word' or char_length(replace(term_norm, ' ', '')) >= 5),
  unique (term_norm, match_mode)
);

create or replace function public.blocked_terms_normalise()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.term_norm := public.moderation_words(new.term);
  return new;
end;
$$;

-- The check runs after the BEFORE trigger has filled term_norm in.
create trigger blocked_terms_normalise
  before insert or update of term on blocked_terms
  for each row execute function public.blocked_terms_normalise();

-- Whole words that look like a blocked fragment but are ordinary names.
create table name_allowlist (
  word text primary key
);

-- Stored in the same normalised form the checker compares against, so a row
-- can be added as plain text ("Assmann").
create or replace function public.name_allowlist_normalise()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.word := replace(public.moderation_words(new.word), ' ', '');
  if new.word = '' then
    raise exception 'allow-list entry has no letters' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger name_allowlist_normalise
  before insert or update of word on name_allowlist
  for each row execute function public.name_allowlist_normalise();

-- Nobody but the database owner can read or change either table.
alter table blocked_terms enable row level security;
alter table name_allowlist enable row level security;
revoke all on blocked_terms, name_allowlist from public, anon, authenticated;

create or replace function public.is_name_allowed(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_words text;
  v_squash text;
begin
  v_words := public.moderation_words(p_name);
  if v_words = '' then
    return true;
  end if;

  if exists (
    select 1 from blocked_terms t
    where t.is_active and t.match_mode = 'word'
      and strpos(' ' || v_words || ' ', ' ' || t.term_norm || ' ') > 0
  ) then
    return false;
  end if;

  -- Order matters: the words are glued back together left to right.
  select coalesce(string_agg(u.w, '' order by u.n), '') into v_squash
  from unnest(string_to_array(v_words, ' ')) with ordinality as u(w, n)
  where not exists (select 1 from name_allowlist a where a.word = u.w);

  v_squash := regexp_replace(v_squash, '(.)\1+', '\1', 'g');

  return not exists (
    select 1 from blocked_terms t
    where t.is_active and t.match_mode = 'substring'
      and strpos(v_squash, replace(t.term_norm, ' ', '')) > 0
  );
end;
$$;

revoke execute on function public.is_name_allowed(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enforcement on profiles.first_name
-- ---------------------------------------------------------------------------
create or replace function public.enforce_name_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' or new.first_name is distinct from old.first_name)
     and not public.is_name_allowed(new.first_name) then
    -- Stable text the app looks for; it never says which word matched.
    raise exception 'NAME_NOT_ALLOWED' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_name_rules() from public, anon, authenticated;

create trigger profiles_enforce_name
  before insert or update of first_name on profiles
  for each row execute function public.enforce_name_rules();

-- A name that arrives from sign-up or a sign-in provider and fails the check
-- must not make account creation fail: leave it empty and onboarding asks again.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(new.raw_user_meta_data ->> 'first_name', '');
begin
  if v_name is not null and not public.is_name_allowed(v_name) then
    v_name := null;
  end if;

  insert into profiles (id, first_name, is_18_plus_confirmed)
  values (
    new.id,
    v_name,
    coalesce((new.raw_user_meta_data ->> 'is_18_plus_confirmed')::boolean, false)
  )
  on conflict (id) do nothing;

  insert into user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- For the owner: profiles that exist today under a name that would now be
-- refused. Nothing is changed automatically. Run in the SQL editor:
--   select * from moderation_flagged_names;
-- ---------------------------------------------------------------------------
create view moderation_flagged_names with (security_invoker = true) as
  select id, first_name, account_status, created_at
  from profiles
  where first_name is not null and not public.is_name_allowed(first_name);

revoke all on moderation_flagged_names from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Starter terms. Sources: our own editorial list, extending the tripwire in
-- content/blocklist.json. Kept deliberately short and reviewable; extend as
-- reports come in.
-- ---------------------------------------------------------------------------
insert into blocked_terms (term, language, category, match_mode) values
  ('fuck', 'en', 'profanity', 'word'),
  ('fucker', 'en', 'profanity', 'word'),
  ('fuckers', 'en', 'profanity', 'word'),
  ('fucking', 'en', 'profanity', 'word'),
  ('fuckin', 'en', 'profanity', 'word'),
  ('fuckboy', 'en', 'profanity', 'word'),
  ('fuckface', 'en', 'profanity', 'word'),
  ('shit', 'en', 'profanity', 'word'),
  ('shitty', 'en', 'profanity', 'word'),
  ('shithead', 'en', 'profanity', 'word'),
  ('bitch', 'en', 'profanity', 'word'),
  ('bitches', 'en', 'profanity', 'word'),
  ('cunt', 'en', 'profanity', 'word'),
  ('cunts', 'en', 'profanity', 'word'),
  ('twat', 'en', 'profanity', 'word'),
  ('wanker', 'en', 'profanity', 'word'),
  ('bollocks', 'en', 'profanity', 'word'),
  ('slut', 'en', 'profanity', 'word'),
  ('sluts', 'en', 'profanity', 'word'),
  ('whore', 'en', 'profanity', 'word'),
  ('whores', 'en', 'profanity', 'word'),
  ('pussy', 'en', 'profanity', 'word'),
  ('porn', 'en', 'profanity', 'word'),
  ('porno', 'en', 'profanity', 'word'),
  ('dildo', 'en', 'profanity', 'word'),
  ('jizz', 'en', 'profanity', 'word'),
  ('cumshot', 'en', 'profanity', 'word'),
  ('motherfucker', 'en', 'profanity', 'substring'),
  ('asshole', 'en', 'profanity', 'substring'),
  ('dickhead', 'en', 'profanity', 'substring'),
  ('cocksucker', 'en', 'profanity', 'substring'),
  ('bastard', 'en', 'profanity', 'substring'),
  ('fuckyou', 'en', 'profanity', 'substring'),
  ('dumbass', 'en', 'profanity', 'substring'),
  ('jackass', 'en', 'profanity', 'substring'),
  ('sex', 'en', 'sexual', 'word'),
  ('sexy', 'en', 'sexual', 'word'),
  ('horny', 'en', 'sexual', 'word'),
  ('nude', 'en', 'sexual', 'word'),
  ('nudes', 'en', 'sexual', 'word'),
  ('naked', 'en', 'sexual', 'word'),
  ('escort', 'en', 'sexual', 'word'),
  ('xxx', 'en', 'sexual', 'word'),
  ('fetish', 'en', 'sexual', 'word'),
  ('milf', 'en', 'sexual', 'word'),
  ('hookup', 'en', 'sexual', 'word'),
  ('nsfw', 'en', 'sexual', 'word'),
  ('bdsm', 'en', 'sexual', 'word'),
  ('anal', 'en', 'sexual', 'word'),
  ('blowjob', 'en', 'sexual', 'word'),
  ('handjob', 'en', 'sexual', 'word'),
  ('onlyfans', 'en', 'sexual', 'substring'),
  ('pornstar', 'en', 'sexual', 'substring'),
  ('sexchat', 'en', 'sexual', 'substring'),
  ('sexslave', 'en', 'sexual', 'substring'),
  ('nigger', 'en', 'slur', 'word'),
  ('niggers', 'en', 'slur', 'word'),
  ('nigga', 'en', 'slur', 'word'),
  ('niggas', 'en', 'slur', 'word'),
  ('faggot', 'en', 'slur', 'word'),
  ('faggots', 'en', 'slur', 'word'),
  ('fag', 'en', 'slur', 'word'),
  ('fags', 'en', 'slur', 'word'),
  ('retard', 'en', 'slur', 'word'),
  ('retarded', 'en', 'slur', 'word'),
  ('tranny', 'en', 'slur', 'word'),
  ('kike', 'en', 'slur', 'word'),
  ('spic', 'en', 'slur', 'word'),
  ('chink', 'en', 'slur', 'word'),
  ('gook', 'en', 'slur', 'word'),
  ('paki', 'en', 'slur', 'word'),
  ('wetback', 'en', 'slur', 'word'),
  ('nazi', 'en', 'hate', 'word'),
  ('nazis', 'en', 'hate', 'word'),
  ('terrorist', 'en', 'hate', 'word'),
  ('rapist', 'en', 'hate', 'word'),
  ('rape', 'en', 'hate', 'word'),
  ('rapes', 'en', 'hate', 'word'),
  ('pedo', 'en', 'hate', 'word'),
  ('pedophile', 'en', 'hate', 'word'),
  ('paedophile', 'en', 'hate', 'word'),
  ('molester', 'en', 'hate', 'word'),
  ('hitler', 'en', 'hate', 'substring'),
  ('whitepower', 'en', 'hate', 'substring'),
  ('bin laden', 'en', 'hate', 'substring'),
  ('adolf hitler', 'en', 'hate', 'substring'),
  ('kukluxklan', 'en', 'hate', 'substring'),
  ('fick', 'de', 'profanity', 'word'),
  ('ficken', 'de', 'profanity', 'word'),
  ('ficker', 'de', 'profanity', 'word'),
  ('fotze', 'de', 'profanity', 'word'),
  ('fotzen', 'de', 'profanity', 'word'),
  ('votze', 'de', 'profanity', 'word'),
  ('hure', 'de', 'profanity', 'word'),
  ('huren', 'de', 'profanity', 'word'),
  ('nutte', 'de', 'profanity', 'word'),
  ('nutten', 'de', 'profanity', 'word'),
  ('scheisse', 'de', 'profanity', 'word'),
  ('scheiss', 'de', 'profanity', 'word'),
  ('scheisskerl', 'de', 'profanity', 'word'),
  ('wichser', 'de', 'profanity', 'word'),
  ('wixer', 'de', 'profanity', 'word'),
  ('spast', 'de', 'profanity', 'word'),
  ('spasti', 'de', 'profanity', 'word'),
  ('mongo', 'de', 'profanity', 'word'),
  ('behindert', 'de', 'profanity', 'word'),
  ('schlampe', 'de', 'profanity', 'word'),
  ('pimmel', 'de', 'profanity', 'word'),
  ('arschloch', 'de', 'profanity', 'substring'),
  ('arschgeige', 'de', 'profanity', 'substring'),
  ('hurensohn', 'de', 'profanity', 'substring'),
  ('schwuchtel', 'de', 'profanity', 'substring'),
  ('missgeburt', 'de', 'profanity', 'substring'),
  ('scheissdreck', 'de', 'profanity', 'substring'),
  ('kinderficker', 'de', 'profanity', 'substring'),
  ('wichsvorlage', 'de', 'profanity', 'substring'),
  ('drecksau', 'de', 'profanity', 'substring'),
  ('dreckshure', 'de', 'profanity', 'substring'),
  ('neger', 'de', 'slur', 'word'),
  ('negerin', 'de', 'slur', 'word'),
  ('kanake', 'de', 'slur', 'word'),
  ('kanaken', 'de', 'slur', 'word'),
  ('zigeuner', 'de', 'slur', 'word'),
  ('schwuchtel', 'de', 'slur', 'word'),
  ('kameltreiber', 'de', 'slur', 'word'),
  ('judensau', 'de', 'slur', 'substring'),
  ('judenschwein', 'de', 'slur', 'substring'),
  ('kanakensau', 'de', 'slur', 'substring'),
  ('vergewaltiger', 'de', 'hate', 'word'),
  ('heilhitler', 'de', 'hate', 'substring'),
  ('sieg heil', 'de', 'hate', 'substring'),
  ('vergewaltigung', 'de', 'hate', 'substring'),
  ('holocaustleugner', 'de', 'hate', 'substring'),
  ('titten', 'de', 'sexual', 'word'),
  ('muschi', 'de', 'sexual', 'word'),
  ('nackt', 'de', 'sexual', 'word'),
  ('nacktbilder', 'de', 'sexual', 'word'),
  ('sik', 'tr', 'profanity', 'word'),
  ('sikim', 'tr', 'profanity', 'word'),
  ('sikerim', 'tr', 'profanity', 'word'),
  ('sikis', 'tr', 'profanity', 'word'),
  ('siktir', 'tr', 'profanity', 'word'),
  ('amk', 'tr', 'profanity', 'word'),
  ('amq', 'tr', 'profanity', 'word'),
  ('amcik', 'tr', 'profanity', 'word'),
  ('amcuk', 'tr', 'profanity', 'word'),
  ('yarak', 'tr', 'profanity', 'word'),
  ('yarrak', 'tr', 'profanity', 'word'),
  ('kahpe', 'tr', 'profanity', 'word'),
  ('ibne', 'tr', 'profanity', 'word'),
  ('ibneler', 'tr', 'profanity', 'word'),
  ('pust', 'tr', 'profanity', 'word'),
  ('gavat', 'tr', 'profanity', 'word'),
  ('pic', 'tr', 'profanity', 'word'),
  ('yavsak', 'tr', 'profanity', 'word'),
  ('dangalak', 'tr', 'profanity', 'word'),
  ('tecavuz', 'tr', 'profanity', 'word'),
  ('tecavuzcu', 'tr', 'profanity', 'word'),
  ('orospu', 'tr', 'profanity', 'word'),
  ('pezevenk', 'tr', 'profanity', 'word'),
  ('sikik', 'tr', 'profanity', 'word'),
  ('sikici', 'tr', 'profanity', 'word'),
  ('serefsiz', 'tr', 'profanity', 'word'),
  ('siktir', 'tr', 'profanity', 'substring'),
  ('sikici', 'tr', 'profanity', 'substring'),
  ('sikik', 'tr', 'profanity', 'substring'),
  ('sikeyim', 'tr', 'profanity', 'substring'),
  ('sikecem', 'tr', 'profanity', 'substring'),
  ('orospu', 'tr', 'profanity', 'substring'),
  ('orospucocugu', 'tr', 'profanity', 'substring'),
  ('gotveren', 'tr', 'profanity', 'substring'),
  ('pezevenk', 'tr', 'profanity', 'substring'),
  ('serefsiz', 'tr', 'profanity', 'substring'),
  ('ananisikeyim', 'tr', 'profanity', 'substring'),
  ('dalyarak', 'tr', 'profanity', 'substring'),
  ('gerizekali', 'tr', 'profanity', 'substring'),
  ('amcik', 'tr', 'profanity', 'substring'),
  ('amina koyim', 'tr', 'profanity', 'substring'),
  ('aminakoyim', 'tr', 'profanity', 'substring'),
  ('amina koyayim', 'tr', 'profanity', 'substring'),
  ('gavur', 'tr', 'slur', 'word'),
  ('terorist', 'tr', 'hate', 'word'),
  ('teroristler', 'tr', 'hate', 'word'),
  ('seks', 'tr', 'sexual', 'word'),
  ('çıplak', 'tr', 'sexual', 'word'),
  ('ciplak', 'tr', 'sexual', 'word'),
  ('puta', 'es', 'profanity', 'word'),
  ('puto', 'es', 'profanity', 'word'),
  ('putita', 'es', 'profanity', 'word'),
  ('putas', 'es', 'profanity', 'word'),
  ('mierda', 'es', 'profanity', 'word'),
  ('joder', 'es', 'profanity', 'word'),
  ('jodete', 'es', 'profanity', 'word'),
  ('cabrona', 'es', 'profanity', 'word'),
  ('marica', 'es', 'profanity', 'word'),
  ('follar', 'es', 'profanity', 'word'),
  ('pendejo', 'es', 'profanity', 'word'),
  ('pendeja', 'es', 'profanity', 'word'),
  ('cojones', 'es', 'profanity', 'word'),
  ('zorra', 'es', 'profanity', 'word'),
  ('verga', 'es', 'profanity', 'word'),
  ('mamon', 'es', 'profanity', 'word'),
  ('mamona', 'es', 'profanity', 'word'),
  ('cabron', 'es', 'profanity', 'substring'),
  ('maricon', 'es', 'profanity', 'substring'),
  ('hijoputa', 'es', 'profanity', 'substring'),
  ('hijodeputa', 'es', 'profanity', 'substring'),
  ('hijueputa', 'es', 'profanity', 'substring'),
  ('gilipollas', 'es', 'profanity', 'substring'),
  ('hijadeputa', 'es', 'profanity', 'substring'),
  ('chupapollas', 'es', 'profanity', 'substring'),
  ('comemierda', 'es', 'profanity', 'substring'),
  ('violador', 'es', 'hate', 'substring'),
  ('pedofilo', 'es', 'hate', 'substring'),
  ('terrorista', 'es', 'hate', 'substring'),
  ('sexo', 'es', 'sexual', 'word'),
  ('desnudo', 'es', 'sexual', 'word'),
  ('desnuda', 'es', 'sexual', 'word'),
  ('neuken', 'nl', 'profanity', 'word'),
  ('hoer', 'nl', 'profanity', 'word'),
  ('hoeren', 'nl', 'profanity', 'word'),
  ('lul', 'nl', 'profanity', 'word'),
  ('kanker', 'nl', 'profanity', 'word'),
  ('tering', 'nl', 'profanity', 'word'),
  ('flikker', 'nl', 'profanity', 'word'),
  ('mongool', 'nl', 'profanity', 'word'),
  ('mietje', 'nl', 'profanity', 'word'),
  ('kutwijf', 'nl', 'profanity', 'word'),
  ('klootzak', 'nl', 'profanity', 'word'),
  ('pleurislijer', 'nl', 'profanity', 'word'),
  ('klootzak', 'nl', 'profanity', 'substring'),
  ('kankerlijer', 'nl', 'profanity', 'substring'),
  ('teringlijer', 'nl', 'profanity', 'substring'),
  ('hoerenzoon', 'nl', 'profanity', 'substring'),
  ('kutwijf', 'nl', 'profanity', 'substring'),
  ('godverdomme', 'nl', 'profanity', 'substring'),
  ('teringhoer', 'nl', 'profanity', 'substring'),
  ('nikker', 'nl', 'slur', 'word'),
  ('verkrachter', 'nl', 'hate', 'substring'),
  ('pedofiel', 'nl', 'hate', 'substring'),
  ('terrorist', 'nl', 'hate', 'substring'),
  ('naakt', 'nl', 'sexual', 'word')
on conflict (term_norm, match_mode) do nothing;

-- Names that merely contain or resemble a blocked fragment. Whole words only.
insert into name_allowlist (word) values
  ('dick'), ('dickinson'), ('hancock'), ('cockburn'), ('sexton'), ('essen'),
  ('assmann'), ('sikander'), ('cumhur'), ('assia'), ('fuchs')
on conflict do nothing;
