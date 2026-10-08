# The learning-content engine

How Lingua Match turns a manageable amount of hand-checked content into a large
amount of varied, graded A1–B1 practice in German, Spanish, Dutch, Turkish and
English — with no AI, no paid API and no per-question cost at runtime.

- [Principles](#principles)
- [Architecture at a glance](#architecture-at-a-glance)
- [Content model](#content-model)
- [Schema](#schema)
- [The content pipeline](#the-content-pipeline)
- [Validation rules](#validation-rules)
- [Exercise engine](#exercise-engine)
- [Lesson generation](#lesson-generation)
- [Spaced repetition](#spaced-repetition)
- [XP and progression](#xp-and-progression)
- [Using it with a match](#using-it-with-a-match)
- [Listening without paid TTS](#listening-without-paid-tts)
- [Sources and licences](#sources-and-licences)
- [How to…](#how-to)
- [Testing](#testing)
- [Cost and performance](#cost-and-performance)
- [Known limitations](#known-limitations)

---

## Principles

1. **Concepts, not language pairs.** A concept is one meaning ("coffee",
   "What music do you like?"). It is written once per language. Every direction
   — Turkish→German, German→Turkish, Spanish→Dutch — is served by the same rows.
   Five languages cost five translations per concept, not twenty pair courses.
2. **Exercises are generated, never stored as content.** One concept feeds up to
   twelve mechanics. Adding a sentence adds gap-fills, word orders, listening,
   translation and true/false exercises at once.
3. **Answers never leave the database before the learner commits.** Generation
   and grading run in Postgres (`SECURITY DEFINER` functions), exactly like the
   existing game engine. The browser receives stripped exercises; XP is granted
   only by code that just graded something.
4. **Files are the source of truth.** Content lives in `content/` as
   spreadsheet-friendly TSV. The database is a build artefact of those files,
   upserted idempotently on stable keys.
5. **Provenance is data.** Every concept and every text row names its source,
   and the Licenses & attributions page is generated from the `content_sources`
   table.
6. **Quality over count.** Nothing imported is shown to learners until it passes
   validation and — for bulk datasets — a human review.

## Architecture at a glance

```
content/*.tsv, *.json ──► scripts/content (validate ► derive lessons ► emit SQL)
        ▲                                   │
        │ importers (offline)               ▼
 CLDR (Intl) · Tatoeba dumps ·      supabase/seed/001x_learn_*.sql
 Wikidata lexeme dump                       │  psql / SQL editor
                                            ▼
                       Postgres: concepts · concept_translations · curriculum
                                            │
         start_lesson / start_review ──► generated exercises (answers kept server-side)
         answer_lesson_exercise      ──► grade · SRS update · retry queue
         complete_lesson_session     ──► score · XP (grant_xp) · next lesson · "use it" phrase
         share_phrase_with_match     ──► chat composer prefilled; sending it = +10 XP
```

The Next.js app only ever calls those functions and a handful of RLS-guarded
reads. No route talks to Tatoeba, Wikidata or any AI service.

## Content model

| Thing | What it is | Example |
| --- | --- | --- |
| **Concept** | One meaning, language-independent. Has a kind (`word`, `phrase`, `sentence`), part of speech, CEFR level, topic, skill. | `coffee` — noun, A1, topic `drinks`, skill `drinks` |
| **Translation** | The concept realised in one language, with accepted alternatives, word tiles, the gap for gap-fills, gender. | de `der Kaffee` (alt `Kaffee`, gender m); tr `kahve` |
| **Topic** | Semantic field used to pick sensible wrong answers. | `drinks`, `weekdays`, `town-places` |
| **Sense group** | Concepts that must never be each other's wrong answer (near-synonyms, or texts that collide in some language). Computed automatically from collisions, overridable. | `you (informal)` / `you (formal)` both read "you" in English |
| **Course** | One per target language. | German |
| **Unit → Skill → Lesson** | The syllabus. Shared by every course unless a row names a language. | A1 "Food and drink" → "Drinks" → "Coffee, tea, water…" |

Sentences use the same concept model. That is natural here because every seed
sentence is written as a set of parallel translations; the language-specific
parts (tiles, gap, alternatives) live on the translation row, so a Turkish
sentence can blank a suffixed word while the German one blanks the verb. An
imported corpus that is not parallel (a stand-alone Tatoeba sentence with only
one translation) still fits: missing languages simply make the concept
unavailable for directions that need them.

**Why not per-pair courses?** With five languages that is twenty courses, each
needing its own curation. Here a new sentence is five cells, and every direction
gets it.

## Schema

Migrations `99990`–`99995` (numbered to sort after the existing `999x`
fix-ups, because the Supabase CLI orders versions as strings).

| Table | Purpose | Client access (RLS) |
| --- | --- | --- |
| `content_sources` | Provenance registry: licence, URLs, attribution text, whether per-item credit is required, `item_url_template`. A check constraint makes it impossible to *enable* a source whose licence forbids commercial use or modification or imposes share-alike. | read (anon + authenticated) |
| `content_import_batches` | One row per source per build/import run, with counts. Every concept/translation points at the batch that last wrote it. | none |
| `courses` | Which target languages have a published course. | read |
| `units`, `skills`, `lessons` | Curriculum. `language_code` null = shared; set = language-specific. `is_active` retires rows without breaking progress. | read |
| `concepts` | Meanings, with kind, POS, CEFR, topic, skill, sense group, English gloss, situation (for "what would you say?"), `is_social`, `status`. | **none** (answer keys) |
| `concept_translations` | Per-language text, alternatives, tiles, gap index + POS, gender, `status`, `source_id`, `source_external_id`, `source_author`, per-item `license`, generated `folded` and `folded_tokens` columns (accent-folded text and tokens, stored so queries never re-normalise). Unique `(concept_id, language_code)`. | **none** |
| `lesson_concepts` | Which concepts a lesson draws from. | none |
| `exercise_templates` | The 13 mechanics; `is_active = false` removes one from every generated lesson. | read |
| `content_flags` | Learner reports and validator findings. | insert/read own |
| `lesson_sessions` | One generated play-through including answer keys and per-exercise results. | **none** (via functions only) |
| `user_concept_progress` | Spaced-repetition state per learner × language × concept. | read own |
| `user_lesson_progress` | Completions and best score per learner × language × lesson. | read own |
| `phrase_shares` | "Use it with a match": a phrase the learner chose to take into a chat. | read own |

Existing tables reused, not duplicated: `languages` (gained `speech_locale`),
`xp_events` / `user_progress` / `grant_xp()` (three new `xp_reason` values), the
chat `messages` table (one trigger), `matches`. The old flat
`vocabulary_words` / `example_sentences` tables are superseded and unused.

Client-writable surface added by this work: only `content_flags` inserts (own
row, `origin = 'user'`). Everything else is written by functions, and write
grants on the new tables are revoked from `anon` and `authenticated` as a second
line of defence.

## The content pipeline

```
OPEN DATASET ─► IMPORT ─► NORMALISE ─► VALIDATE ─► MAP TO LANGUAGE / TOPIC / CEFR ─► SEED ─► GENERATE
 (offline)     importer   cleanText    validate   curriculum + estimateCefr        SQL     in Postgres
```

```
content/
  languages.json           course languages, speech locales, noun articles
  sources.json             provenance registry (→ content_sources)
  curriculum.json          courses, units, skills
  blocklist.json           words that must never appear (import tripwire)
  concepts/*.tsv           concepts, with one column per language (editorial content)
  concepts/cldr.tsv        GENERATED from Unicode CLDR
  <lang>/*.tsv             per-language rows (imports, new languages, overrides)
  imported/                review-only reports (Wikidata); never loaded
scripts/content/
  validate.ts              npm run content:validate
  build-seed.ts            npm run content:build  → supabase/seed/0010–0014_learn_*.sql
  import-cldr.ts           npm run content:import:cldr
  import-tatoeba.ts        npm run content:import:tatoeba -- --dir <exports>
  import-wikidata.ts       npm run content:import:wikidata -- --dump <lexemes.json>
  lib/                     text, model, validate, build, tatoeba, wikidata
  content.test.ts          npm test
```

Scripts run on Node ≥ 22.18 directly (`node file.ts`, type stripping); no build
step and no new dependencies.

**Seed files are idempotent.** Every statement upserts on a natural key. Re-run
them after any content change. Two rules protect live data:

- A row disabled in the database stays disabled on rebuild until it is
  re-enabled there (moderation done in Studio is not silently undone).
- Units, skills and lessons missing from the files are set `is_active = false`,
  never deleted, so learner progress keeps its foreign keys.

### Lessons are derived

A skill's words are dealt into "learn" lessons of about six words each, with
the skill's sentences spread across them, followed by one "Put it together"
practice lesson over the whole skill. Adding rows to a skill grows its lessons
with no curriculum edit. Titles come from the first glosses
("Coffee, tea, water…").

## Validation rules

`npm run content:validate` (errors block `content:build`; warnings print).

| Rule | Level |
| --- | --- |
| Enabled source with a non-commercial, no-derivatives or share-alike licence | error |
| Unknown language, skill, source, kind, POS, CEFR; malformed keys/topics | error |
| Editorial concept missing a core language | error (warning for imports) |
| Imported row without a source id (`ext_id`) | error |
| Duplicate concept key, duplicate `(concept, language)`, two sentences with the same text | error |
| Sentence longer than 9 words / 60 chars (A1) or 12 words / 90 chars (A2) | error |
| Sentence without final `. ! ?`, not starting with a capital, Spanish question without `¿` | error |
| Control characters, stray whitespace, brackets/markup/links, punctuation-only tokens | error |
| Blocklisted word (whole word, case-insensitive; accents count) | error |
| Gap word not in the sentence | error |
| German noun not capitalised | error |
| Noun without article (de/es/nl), gap with unknown part of speech, Spanish `!` without `¡`, sentence too short for word order, beyond A2 | warning |

Tatoeba imports add their own filters before any of that: length, a single
sentence, no digits, no markup, no stock names ("Tom", "Mary"), blocklist,
duplicates against existing content, and a curriculum-coverage test (below).

### CEFR is an estimate, and says so

Editorial CEFR levels are an editor's judgement. For imports,
`estimateCefr()` is a deterministic approximation: A1 if every language version
has at most 7 words and at least 75 % of its words are already taught by the
course; A2 at ≤ 10 words and ≥ 60 %; otherwise rejected as out of scope. It is
not an assessment; override it in the generated file.

## Exercise engine

Thirteen mechanics (`exercise_templates`), all generated from concepts:

| Mechanic | Uses | Answer |
| --- | --- | --- |
| New words | first sight of up to four words, with meaning | ungraded |
| What does it mean? (`vocab_choice`) | target word → pick meaning | choice |
| How do you say it? (`vocab_recall`) | meaning → pick target word | choice |
| Match the pairs | 3–4 words ↔ meanings, no synonyms together | all pairs |
| Type it (`type_translation`) | meaning → type target word; article optional | text |
| Listen and pick (`listen_choice`) | device voice → pick the text | choice |
| Type what you hear (`listen_type`) | dictation, ≤ 7 words | text |
| Fill the gap (`missing_word`) | sentence with one gap + meaning hint | choice |
| Build the sentence (`word_order`) | meaning → order the tiles | tiles |
| Translate it (`word_bank`) | meaning → tiles with decoys | tiles |
| Which translation? (`sentence_choice`) | target sentence → pick meaning | choice |
| True or false | does this translation match? | yes/no |
| What would you say? (`context_choice`) | English situation → pick the phrase | choice |

**Grading** (`learn_grade`) ignores case, punctuation and spacing
(`learn_norm`); an answer that differs only in accents or ß/ss is accepted with
a "mind the accents" note (`learn_fold`). Alternatives (articles, contractions,
gendered forms) are accepted when typing. Normalisation is written to behave
the same under any database locale.

### Distractors

Chosen by SQL over our own tables, deterministically ranked and randomised only
among equals:

- **Words:** same kind → same part of speech → same topic → same skill →
  level ≤ target. "Kaffee = ?" offers *tea, milk, water*, not *airport*.
- **Sentences:** same skill and topic, similar length. For "what would you
  say?", deliberately a *different* topic, so a wrong option cannot also fit.
- **Gaps:** words other sentences blank out with the same part of speech,
  preferring the same ending (`trinke` → `wohne`, `spiele`) so grammar alone
  does not give the answer away, topped up with dictionary words of the same
  topic (a country gap gets other countries). German keeps capitalisation
  consistent; other languages show options in the answer's case.
- Never a near-synonym (sense group) and never anything that folds to the same
  text as the answer or another option.

## Lesson generation

`start_lesson(lesson_id, audio)` builds a session in one call:

1. Pick the lesson's playable concepts (active in both the target and the
   learner's known language). A practice lesson uses the whole skill, weakest
   items first.
2. Up to four never-seen words get a "New words" card.
3. A fixed plan of 12 slots is filled in order — for a learn lesson:
   `vocab_choice, vocab_choice, match_pairs, missing_word, vocab_recall,
   sentence_choice, listen_choice, word_order, true_false, context_choice,
   listen_type, word_bank` (the last is the final challenge). Each slot takes the
   concept used least so far whose content can carry that mechanic, and falls
   back to a simpler mechanic when needed. No concept gets the same mechanic
   twice in a session.
4. Without a device voice, listening slots become reading/typing slots.
5. A wrong answer re-queues that exercise, reshuffled, at the end (at most
   three per session). Scoring counts first attempts only.

`start_review(audio)` takes the learner's ten most due items (oldest due, lowest
box, most missed) and chooses harder mechanics as an item climbs the boxes:
recognise (box 0–1) → recall (2–3) → produce (4–5), plus a matching round.

The known language is the learner's native language when content exists for
it, otherwise English (the UI language).

## Spaced repetition

Leitner boxes 0–5 per learner × target language × concept
(`user_concept_progress`), updated on every graded answer:

| Event | Effect |
| --- | --- |
| New item answered right | box 1, due in 1 day |
| Right, and the item was due | up one box; intervals 1 d, 3 d, 7 d, 14 d, 30 d |
| Right, but not yet due | counted, no promotion (cramming earns nothing) |
| Wrong | down two boxes, due again in 10 minutes |

`mastery` = box × 20 %. A skill's mastery bar is the average over its concepts,
so it drops again if reviews are skipped. "Can't listen now" skips never touch
SRS.

## XP and progression

One currency: the existing XP, through the existing `grant_xp()` (which also
keeps the streak).

| Action | XP |
| --- | --- |
| Lesson, first completion | 15 |
| Lesson, replay | 5 |
| Review session | 10 |
| No mistakes at all (lesson or review) | +5 |
| A learned phrase actually sent to a match | +10 (max 3 a day) |

Lesson and review XP needs at least half of the first attempts right; a
weaker session still counts as practice (progress, SRS) but earns nothing, so
replays and reviews cannot be farmed by guessing. The existing daily
challenge, missions and corrections keep their XP unchanged.

## Using it with a match

The differentiator: *learn something → use it with a real person*.

- Concepts flagged `social` (85 questions and invitations such as *Welche Musik hörst du
  gerne?*, *¿Qué haces este fin de semana?*, *Wat doe je dit weekend?*, *Bu
  hafta sonu ne yapıyorsun?*) are offered at the end of a lesson as **Use it**.
- **Ask a match** opens a picker (native speakers of the language first).
  Choosing one calls `share_phrase_with_match()` and opens the chat with the
  phrase in the composer — unsent, editable, with a dismissible note.
- When a message containing the phrase is sent, a trigger on `messages` marks
  the share used and grants +10 XP (three a day). The trigger's fast path is a
  partial-index lookup that finds nothing for almost every message.

Nothing is sent automatically and nothing interrupts the chat.

## Listening without paid TTS

The browser's `SpeechSynthesis` reads target-language text with a voice whose
language matches `languages.speech_locale` (`de-DE`, `es-ES`, `nl-NL`, `tr-TR`,
`en-GB`). If the device has no matching voice, lessons are generated without
listening exercises and speaker buttons disappear; a "Can't listen now" button
covers sessions generated elsewhere. There is no pronunciation scoring. Note
that the text of a listening exercise necessarily reaches the browser (the
browser does the speaking).

## Sources and licences

Verified 2026-09-27; full research in
[`docs/open-content-licensing.md`](./open-content-licensing.md). Not legal
advice.

| Source | Licence | Commercial | Attribution | Used as |
| --- | --- | --- | --- | --- |
| Lingua Match editorial | Proprietary (original work) | yes | — | **All seed vocabulary, sentences, curriculum** |
| Unicode CLDR via ICU/`Intl` | Unicode-3.0 | yes | keep the licence notice (Licenses page) | **Weekday, month, country and language names** (`concepts/cldr.tsv`, CLDR 48) |
| Tatoeba (text only) | CC BY 2.0 FR; some CC0 1.0 | yes | credit each sentence's contributor + link (shown under the exercise and on the Licenses page) | Importer ready; imports land as `needs_review` |
| Wikidata Lexemes | CC0 1.0 | yes | not required | Gender checks and translation suggestions for review; glosses/examples never copied |
| LibreLingo courses | Spanish course LICENSE says CC BY-NC-SA 4.0 (metadata says CC BY-SA); software AGPL | **no / unclear** | — | **Not used** |
| Wiktionary / kaikki, Open Dutch WordNet, FrequencyWords | CC BY-SA (share-alike) | yes, but SA would extend to our database | — | **Not used** (the source check constraint forbids enabling them) |
| OpenSubtitles / OPUS | unclear copyright | — | — | **Not used** |
| Tatoeba audio | per speaker, often non-commercial | mixed | — | **Not used** (device TTS instead) |
| Goethe / Cervantes / Cambridge word lists, Duolingo | proprietary | no | — | **Not used**; nothing copied |

## How to…

### Add or fix content
Edit the TSV (see [`content/README.md`](../content/README.md) for the cell
syntax), then:

```bash
npm run content:validate
npm run content:build
```

Commit the changed `content/` and `supabase/seed/001*_learn_*.sql` files, merge,
then apply them with **Actions → Deploy database**
([how](./deploying-the-database.md)) or locally:
`for f in supabase/seed/001*_learn_*.sql; do psql "$DATABASE_URL" -f "$f"; done`.

### Disable bad content
Fastest, in the database (sticks across rebuilds):

```sql
update concept_translations set status = 'disabled'
where concept_id = (select id from concepts where key = 's.some-sentence') and language_code = 'nl';
-- or the whole concept, every language:
update concepts set status = 'disabled' where key = 's.some-sentence';
```

Then mirror it in the files (`status=disabled` in the concept's flags, or a
`status` column in a per-language file) so the next editor sees it. Re-enable
with `status = 'active'`. Learner reports are in
`select * from content_flags where status = 'open' order by created_at desc;`.

### Correct a translation, change a CEFR level, reassign a topic or skill
Change the cell / `cefr` / `topic` / `skill` column and rebuild. Keys never
change, so progress is kept.

### Trace an item to its source
```sql
select c.key, t.language_code, t.text, s.name, s.license, coalesce(t.license, s.license) as item_licence,
       t.source_external_id, t.source_author, b.label as batch, b.created_at
from concept_translations t
join concepts c on c.id = t.concept_id
join content_sources s on s.id = t.source_id
left join content_import_batches b on b.id = t.import_batch_id
where c.key = 'coffee';
```

### Add a unit or skill
Add it to `content/curriculum.json` (units are ordered by CEFR, then file
order), point concepts at the new skill key, rebuild. Lessons appear
automatically. A skill or unit only for one language gets `"language": "de"`.

### Add a lesson
Lessons are derived from skills. To get more lessons, add concepts to the
skill; to split a topic differently, create another skill. (A hand-authored
lesson list per skill is a small extension of `deriveLessons()` if ever
needed.)

### Import new content
- **CLDR** (dates, countries, language names): `npm run content:import:cldr`.
- **Tatoeba**: download the per-language exports listed at the top of
  `scripts/content/import-tatoeba.ts`, decompress, run
  `npm run content:import:tatoeba -- --dir <folder> --max 300`. Review
  `content/concepts/tatoeba.tsv` and `content/<lang>/tatoeba.tsv`, switch good
  rows to `status=active`, rebuild. Each row keeps its Tatoeba id, contributor
  and licence.
- **Wikidata**: `npm run content:import:wikidata -- --dump latest-lexemes.json`
  writes gender disagreements and translation suggestions to
  `content/imported/wikidata/` for review.

### Add a fifth language (e.g. French)
1. Add `"fr"` to `content/languages.json` (name, flag, `speechLocale`,
   `nounArticles`, `core: false` until complete).
2. Add a `fr` column to the concept files, or put rows in
   `content/fr/*.tsv` (`key`, `text`). `npm run content:validate` lists what is
   missing.
3. `npm run content:import:cldr` fills French weekday/month/country/language
   names automatically.
4. Add `{ "language": "fr", … }` to `courses` in `curriculum.json`.
5. Rebuild and seed. Lessons with at least four concepts available in both
   languages appear; nothing in the schema, SQL functions or UI changes.
   (Optional: special characters for the typing keyboard in
   `TypeExercise.tsx`.)

## Testing

```bash
npm test                     # pipeline unit tests (Node test runner)
npm run content:validate     # content rules
PGHOST=/tmp PGPORT=5432 PGUSER=postgres npm run test:db
```

`test:db` builds a scratch database on any local Postgres 15+ with a small
Supabase shim (`supabase/tests/supabase_shim.sql`), applies every migration and
seed, and runs `supabase/tests/test_learning_engine.sql`: it plays real lessons,
replays and reviews through the RPCs as the `authenticated` role in eight
directions (tr→de, de→tr, tr→es, es→tr, tr→nl, nl→tr, de→es, en→de), checks
that no answer key reaches the client, options are distinguishable, XP and
streaks add up, SRS rows are stored and follow the Leitner rules, distractors
stay on topic, RLS blocks every content/XP/SRS write and cross-user access, and
that a shared phrase sent in chat earns XP once.

## Cost and performance

Measured on the local suite (≈ 1,100 concepts × 5 languages, A1–B1):
`get_learn_overview` ≈ 20–30 ms, `start_lesson` ≈ 25–55 ms,
`start_review` ≈ 20 ms, `answer_lesson_exercise` one small round trip per
answer. Nothing loads whole datasets client-side; there are no Realtime
subscriptions for learning. Wrong-answer candidates are ranked over the
language's pool (a few thousand indexed rows), so generation cost grows with
the pool, not just the lesson.

What keeps that cheap is the rule that **the hot path never normalises text**.
`learn_fold()` is a regex-heavy function, so folded text and folded tokens are
stored (`folded`, `folded_tokens`) and the distractor queries compare stored
values. Before migration `99995` they re-folded the pool on every call
(≈ 180,000 calls per lesson); with the `search_path` pinned on the helper, as
the database linter requires, each of those calls was also expensive, and
`start_lesson` took ≈ 0.9 s. If you add a query that ranks or filters candidates
by folded text, use the stored columns.

Fresh loads have no planner statistics until autovacuum runs, and lesson
generation on missing statistics is ≈ 20× slower. The test runner and
`scripts/db/deploy.sh` therefore run `ANALYZE` after seeding.

Seed files total ≈ 1.3 MB.

## Known limitations

- Seed volume: 1,106 concepts per language (565 words, 70 phrases, 471
  sentences), 19 units, 59 skills, 173 lessons — a real foundation, not yet the
  1,500 / 2,000 target.
- Editorial translations were written and cross-checked carefully but have not
  been reviewed by native-speaker editors; the report button and
  `content_flags` exist for exactly that.
- Tatoeba and Wikidata importers are implemented and unit-tested on synthetic
  fixtures, but no real dump was imported in this change (the build environment
  could not reach those hosts); the Tatoeba source row is ready and shows
  "no texts yet".
- CEFR levels are editorial or estimated, not certified.
- Grammar is taught implicitly through sentences; there are no explanation
  pages yet, and no language-specific units (the schema supports them).
- Listening depends on device voices; there is no pronunciation scoring.
- Match-pairs gives feedback once all pairs are made, because the key stays
  server-side.

## Practice runs (Daily and Quick challenges)

The Learn tab's Daily challenge and Quick challenges are generated from the same
content as lessons: a **practice run** is a deck of five cards built by the same
generators (`learn_compose` / `learn_build_exercise`), graded by `learn_grade`,
recorded in `user_concept_progress` (spaced repetition) and paid in XP once, at
the end. Missions and partner challenges still use the old `game_templates`
engine and are not affected. Migration: `supabase/migrations/999998_practice_runs.sql`.

| RPC | What it does |
| :--- | :--- |
| `start_practice_run(p_kind, p_exercise_type, p_audio)` | `p_kind` is `daily` or `quick`. `p_exercise_type` (quick only): `meaning`, `build`, `type`, `listen`, `mixed`. Returns the stripped run, or `{available:false, reason}` (`no_course`, `not_enough_content`) instead of an error. |
| `get_practice_run(p_run_id)` | The same payload for a refresh or deep link, including answers already given. `null` for someone else's run. |
| `answer_practice_card(p_run_id, p_card_index, p_answer)` | Grades one card; returns `{correct, note, solution, expected, graded}`. Idempotent: answering twice returns the first verdict. |
| `finish_practice_run(p_run_id)` | Awards XP via `grant_xp()` and returns the summary. Idempotent: a second call grants nothing. |

**Card choice.** Up to eight concepts are picked: two due for review, two already
met, the rest new and at the learner's CEFR level (falling back to anything with
both translations). `learn_compose` turns them into five exercises from a plan that
depends on the style; slots the content cannot fill are skipped. Fewer than three
cards means "not enough content yet".

**Daily** is seeded from user + date (`setseed`, so the generators' `random()` is
reproducible) and is the same all day: the first run of the day fixes the deck and
repeats replay it (picking again would give another deck, because answering moves
concepts between "new", "met" and "due"). An unfinished daily run is resumed.
**Quick** is random on every call. "Today" is the UTC day, like the rest of the
Play hub.

**Answer keys never reach the client.** `practice_runs` has no client policy or
grants (like `lesson_sessions`); cards are returned through
`learn_strip_exercises`, and the key for a card is returned only after it has been
answered.

**XP rules** are constants in one place, `practice_rules()`:

| | |
| :--- | :--- |
| Needed for any XP | 3 first-try correct answers out of 5 |
| Daily | 15 XP for the first rewarded run of the day, 5 XP for later runs |
| Quick | 10 XP |
| Perfect run (5/5) | +5 XP |

Skipped listening cards are not scored (like in lessons).

`get_play_overview()` takes `daily_challenge` and `practice` from this engine; the
keys keep their old shape (`game_template_id` is now `null`, new `kind`/`style`).
`completed_today` reflects completed daily runs. Tests: `supabase/tests/test_practice_runs.sql`.
