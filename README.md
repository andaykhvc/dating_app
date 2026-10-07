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
RLS policies, the trusted functions, the shaped read functions, the storage
bucket, the `999x` fix-ups, and the learning-content engine (`99990`–`99995`,
numbered so they sort after the fix-ups: the CLI compares versions as strings).

### 4. Seed the content

The seed files are not migrations, so run them yourself in order. Paste each one
into the Supabase SQL Editor, or use `psql` with your connection string:

```bash
for f in supabase/seed/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

This loads the languages, 24 interests, the 7 game templates, 18 mission
templates and the original challenge content, then (files `0010`–`0014`) the
learning course: 19 A1–B1 units, 59 skills, 173 lessons and 1,106 concepts in
German, Spanish, Dutch, Turkish and English, with their provenance. Only the
course files (`0010`–`0014`) are safe to re-run; `0001`–`0007` are run once.

### Updating an existing project

After the first setup, new migrations and course content are applied from
GitHub: **Actions → Deploy database → Run workflow**. It needs one repository
secret, `SUPABASE_DB_URL`. Setup and first-run steps are in
[docs/deploying-the-database.md](docs/deploying-the-database.md).

How to fill in the form:

1. **Use workflow from:** pick `main`, unless you are testing a branch. A
   branch that is behind the database stops with an explanation and changes
   nothing.
2. **1. Dry run:** leave it ticked the first time. It is a rehearsal that lists
   what would run and writes nothing.
3. **2. Also load the course content:** leave it ticked. Re-running it is safe.
4. **3. mark_applied_through:** leave it empty. Fill it in only if a run
   stopped and asked for it.
5. Read the summary at the bottom of the run page. If it looks right, run it
   again with **Dry run** unticked to apply it for real.

If a run stops, the summary says why and what to do; the common cases are
listed in the docs above.

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
                           games, learn, profile, progress
  lib/                     supabase clients, image compression, dates
  types/                   domain types mirroring the SQL function results
content/                   course content as TSV + JSON (source of truth)
scripts/content/           importers, validator, seed builder, unit tests
supabase/
  migrations/              schema, indexes, RLS, functions
  seed/                    languages, interests, missions, game content,
                           generated course content (0010–0014)
  tests/                   scratch-database test runner + SQL test suite
docs/                      content system and licensing research
```

### Home Screen installation

The final onboarding screen and Settings → **Add to Home Screen** share a
device-aware installation guide. Installation is optional; **Start swiping**
still completes onboarding normally. The root install provider keeps a browser
install offer available across client-side navigation.

On supported Chromium browsers, **Install Lingua Match** opens the browser's
confirmation dialog when `beforeinstallprompt` is available. Dismissals and
errors fall back to manual instructions. iPhone/iPad users get Safari's Share →
Add to Home Screen steps, including desktop-mode iPads. Desktop guidance and
manual device selection are also available. Standalone mode and `appinstalled`
replace the guide with a ready state; no permanent installed flag is stored.

The existing manifest and icons provide standalone launching at `/discover`.
This feature adds no offline caching; using the app still needs a connection.
Native installation requires user confirmation and should also be checked on
physical iOS Safari and Android Chrome devices before release. See
[Apple's installation steps](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios)
and [MDN's install prompt lifecycle](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt).

### Android APK

`android/` packages the deployed site as a Trusted Web Activity: a ~1 MB APK
that opens https://dating-app-ruddy.vercel.app full-screen in Chrome. Because
it uses Chrome, sessions and Google/Apple sign-in behave exactly as on the
web, and web changes reach the app without a new APK.

**Actions → Android APK → Run workflow** builds it and publishes
`lingua-match-<version>.apk` as a GitHub Release. It only runs on demand: no
push, tag or pull request triggers it. `android/twa-manifest.json` holds the package id, colours
and icons; `android/generate.mjs` turns it into a Gradle project with
`@bubblewrap/core` at build time, so no generated Android code is committed.

The APK is signed with the key in the `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`
repository secrets. Keep that key: phones only accept updates signed with the
same one. Its SHA-256 fingerprint is in `public/.well-known/assetlinks.json`,
which is what lets the app hide Chrome's URL bar; the workflow fails if the
two disagree. If the domain changes, update `host` and the URLs in
`twa-manifest.json`.

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

### The learning course

The Learn tab (route `/play`) holds a structured A1–B1 course for German,
Spanish, Dutch, Turkish and English, built on a language-agnostic content
model: a *concept* ("coffee", "What music do you like?") is written once per
language, and every direction — Turkish→German, German→Turkish, Spanish→Dutch —
is served by the same rows. Lessons are generated in Postgres from concepts
(13 mechanics, distractors picked by part of speech and topic), graded
server-side, and fed into a Leitner spaced-repetition queue. XP flows through
the same `grant_xp()` as everything else.

Each lesson ends with a phrase worth trying on a real person. **Ask a match**
opens that chat with the phrase in the composer — unsent, editable — and
actually sending it earns XP.

Content lives in `content/` as TSV, is validated and compiled to seed SQL by
`scripts/content/`, and every row records its source and licence; the public
`/licenses` page is generated from that. No AI and no external API are called
while anyone learns.

Everything about it — schema, pipeline, validation rules, exercise engine, SRS,
licences, and how to add content or a language — is in
**[docs/content-system.md](docs/content-system.md)**. The licensing research
behind the source choices is in
[docs/open-content-licensing.md](docs/open-content-licensing.md).

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

The course content grows by adding rows to `content/` (hand-written, or via
the CLDR, Tatoeba and Wikidata importers) and rebuilding the seed — no schema
change, no migration, no code. See
[docs/content-system.md](docs/content-system.md#how-to).

Adding a language is a `content/languages.json` entry, its translations, and a
course entry in `content/curriculum.json`. The onboarding pickers, the Learn tab
and the lesson generator pick it up from the data.

The original `vocabulary_words` / `example_sentences` tables are superseded by
`concepts` / `concept_translations` and no longer read by the app.

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

```bash
npm test                    # content pipeline, app-install and lint compatibility tests
```

```bash
npm run content:validate    # content quality rules
```

```bash
# Every migration + seed on a scratch local Postgres, then end-to-end lesson,
# SRS, XP, RLS and social-phrase checks in eight learning directions.
PGHOST=/tmp PGPORT=5432 PGUSER=postgres npm run test:db
```

The `@next/eslint-plugin-next` dependency has a scoped `fast-glob` →
`tinyglobby` override to remove the unpatched `braces` dependency
([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)).
This plugin uses `globSync` with `onlyDirectories`; `scripts/lint-glob.test.mjs`
checks directory matching and the internal-link rule with the replacement.
Keep the override scoped to this caller: the two libraries differ in other
options and directory-expansion behavior. CI still audits all dependencies.
