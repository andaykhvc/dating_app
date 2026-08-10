# Lingua Match

A mobile-first PWA for meeting language partners across Europe and the US. You
swipe through people who speak what you are learning, and a match arrives with a
mission attached — something real to talk about instead of an empty chat box.
Partners correct each other's sentences by hand, earn XP for it, and keep a
streak going. Dating is one optional intention among several, and anyone can
filter it out entirely.

Built to run on **Supabase Free + Vercel Free**, with no AI and no paid APIs.

---

## Status

The application is complete and typechecks, lints and builds. **It has not been
run against a live database**, because no Supabase project exists yet — creating
one requires your account. Follow the setup below and the whole flow works
end to end; until then, treat the SQL as reviewed but unexecuted.

---

## Setup

### 1. Create a Supabase project

Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a
free project. Note the project's **Project URL** and **anon public** key from
Project Settings → API.

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. There is
no service-role key: everything that has to be trusted runs inside Postgres, so
the app never holds a key that can bypass Row Level Security.

### 3. Run the migrations

Link the CLI to your project, then push. There is no local Docker Postgres in
this setup — the hosted free tier is the development database.

```bash
npx supabase login
```

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

```bash
npx supabase db push
```

`supabase/migrations/` runs in filename order: enums, tables by domain, indexes,
RLS policies, the trusted functions, the shaped read functions, and the storage
bucket.

### 4. Seed the content

The seed files are not migrations, so run them yourself in order. Paste each one
into the Supabase SQL Editor, or use `psql` with your connection string:

```bash
for f in supabase/seed/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

This loads 3 launch languages, 24 interests, the 7 game templates, 18 mission
templates, and playable content plus a starter word/sentence/prompt library for
English, German and Spanish.

### 5. Auth settings

In Authentication → URL Configuration, add your site URL and
`http://localhost:3000/auth/callback` as a redirect URL. Email confirmation is
on by default; switching it off in Authentication → Providers → Email makes
local testing faster.

### 6. Run it

```bash
npm run dev
```

Open <http://localhost:3000> on a phone-sized viewport. To see a match, sign up
twice in two different browsers with complementary languages (one native English
learning Spanish, one native Spanish learning English) and like each other.

### 7. Generated types (recommended)

The query builder is currently untyped because generated types need a live
project. Once yours exists:

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

Then parameterise the clients in `src/lib/supabase/` with `<Database>`.

### 8. Deploy

Import the repository on Vercel, add the same two environment variables, and
deploy. Add the deployed origin to Supabase's redirect URLs.

---

## How it is put together

```
src/
  app/                     routes only — thin, most logic lives in features/
    (auth)/                login, signup, and the one Route Handler
    (onboarding)/          eight steps, each saving as it goes
    (app)/                 the authenticated shell with bottom navigation
  components/              ui primitives, layout, hand-drawn icons
  features/                auth, onboarding, discovery, matching, chat,
                           games, profile, progress
  lib/                     supabase clients, image compression, dates
  types/                   domain types mirroring the SQL function results
supabase/
  migrations/              schema, indexes, RLS, functions
  seed/                    languages, interests, missions, game content
```

### Where the trust boundary sits

Every table has RLS enabled, and anything with no policy for an operation is
simply unreachable from the browser. Three consequences worth knowing:

- **`profiles` is own-row-only.** Nobody selects another person's profile row.
  Other people are reached exclusively through `discover_profiles()`,
  `get_matches()` and `get_profile_card()`, which name every column they return.
  That is why a date of birth never leaves the database — only a computed age.
- **`xp_events` and `user_progress` have no write policies at all.** XP is
  granted only inside `SECURITY DEFINER` functions that just validated
  something, so a user cannot award themselves points.
- **`game_content` has no read policy.** Its payload holds the answer keys.
  Content reaches the browser through functions that strip the answer first, and
  grading happens in Postgres.

The one Next.js Route Handler in the project is the Supabase auth callback.
Everything else is either a direct RLS-guarded query or a Postgres function
call — which is both free and, for the integrity-sensitive writes, atomic.

### Swipe → match, without a race

`record_swipe()` inserts the swipe, checks for a reverse like on the same index,
and inserts the match with `ON CONFLICT DO NOTHING`. When two people swipe at
the same instant, both transactions attempt the insert, the unique constraint on
`(user_a, user_b)` lets exactly one through, and the other reads back the
winner's row. The same call attaches the pair's first mission, so a match and
something to talk about are created together or not at all.

### The game engine

`game_templates` defines the seven mechanics; `game_content` supplies the data.
Each type has exactly one renderer in
`src/features/games/components/templates/`. **Adding a new exercise is a seed
row and touches no code** — only a genuinely new mechanic needs a new renderer.

The four free-text types (ask your partner, conversation mission, voice
challenge, correction challenge) cannot be machine-graded without an AI service,
so they do not pretend to be: you confirm you did it and earn less XP than a
graded answer. The three graded types are marked server-side against content the
client never sees the answer to.

---

## Cost decisions

The free tiers are the design constraint, not an afterthought:

- **Photos are compressed in the browser** to 1280px WebP before upload, turning
  a 6 MB camera photo into roughly 100–150 KB of Storage.
- **The photo bucket is public**, so rendering a deck of cards needs no signed
  URL round trips. Object keys are unguessable UUIDs and writes are restricted
  to the owner's own folder.
- **One Realtime channel at a time**, open only while a chat thread is on
  screen — never one per conversation you have ever had.
- **Reads are shaped by Postgres**, so a screen is one round trip rather than an
  N+1 waterfall.
- **Messages paginate by keyset** on the bigint id, so opening a long
  conversation costs the same as opening a new one.
- **XP is read from a pre-aggregated row**, never summed from history.
- **No service worker**, no icon library, no swipe library, no form library.
  Total runtime dependencies: `next`, `react`, `react-dom`, `@supabase/ssr`,
  `@supabase/supabase-js`.

---

## Scaling the content library

The seed is deliberately small — it establishes the shape, not the volume. The
targets (~500 words, ~1,000 sentences, ~100 prompts per language) are reached by
bulk-loading `vocabulary_words`, `example_sentences` and `conversation_prompts`,
which already carry `source`, `source_license` and `source_url` columns for
exactly that. Import a CSV through Supabase Studio or `psql \copy`; no schema
change and no migration is involved. Keep the licence metadata populated when
you bring in an external dataset.

Adding a language is one row in `languages` with `is_launch_language = true`,
plus `game_content` rows for it. The onboarding pickers and the daily challenge
read that flag, so no code changes.

---

## Safety

18+ is enforced at signup, in a trigger, and again when onboarding completes.
Report and block are one tap from any chat. Blocking is a function rather than a
plain insert because it also has to end the match — a block that leaves the
conversation open is decorative. Blocked people disappear from each other's
Discover feed in both directions. Location is city and country only; there is no
coordinate stored anywhere. Anyone can set their feed to language partners only,
which hides everyone open to dating.

Reports land in the `reports` table for review in Supabase Studio, which is the
right amount of moderation infrastructure for a product with no users yet.
`profiles.is_photo_verified` exists and defaults to false so a verification flow
can be added later without a migration.

---

## Deliberately not built

Payments, subscriptions, premium tiers, video or voice calls, push
notifications, read receipts, stories, disappearing messages, an elaborate
leaderboard, native apps, and any form of AI. Those are decisions to revisit
once people are actually using this — not before.

## Checks

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npm run build
```
