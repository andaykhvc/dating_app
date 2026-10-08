# Blocked profile names

Names are checked in the database (`supabase/migrations/99998_name_moderation.sql`),
so the form cannot be bypassed. The word list lives in the table `blocked_terms`
and cannot be read by the app. Everything below is run in the Supabase **SQL
editor**.

## How a name is matched

Look-alike characters (`s1k1c1`), Turkish and other accents (`İ ı ş ğ ß`), capital
letters, separators (`s.i.k.i.c.i`, `f u c k`) and stretched letters (`siiiik`) are
all folded away before comparing. A term is one of two kinds:

- **word** (default): blocks when the name contains it as a whole word. Use this
  for anything short, so it can never hit the middle of an ordinary name.
- **substring**: blocks when the letters appear anywhere in the name. Only for
  distinctive terms of 5+ letters (the database refuses shorter ones).

## Add a term

```sql
insert into blocked_terms (term, language, category, match_mode)
values ('someword', 'de', 'profanity', 'word');
-- category: profanity, slur, sexual, violence, hate, public_figure
```

## Switch a term off (or on again)

```sql
update blocked_terms set is_active = false where term = 'someword';
```

## A real name is being blocked

Add it to the allow-list (it is ignored for *substring* checks), or switch the
term off:

```sql
insert into name_allowlist (word) values ('Assmann');
```

Whole-word terms cannot be allow-listed; switch those off instead. Known trade-off:
the German surname *Fick* and the word *Niger* are blocked as whole words.

## Who already has a name that would now be refused?

Nobody is renamed automatically. See the profiles to review:

```sql
select * from moderation_flagged_names;
```

To rename one, update `profiles.first_name` (the check applies, so pick an allowed
name) or set `account_status = 'suspended'`.

## What a person sees

"That name can't be used. Please use the name you'd like people to call you."
It never says which word matched. If a name arrives through sign-up and fails, the
account is still created with an empty name and onboarding asks again.
