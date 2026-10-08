# Deploying database changes from GitHub

The **Deploy database** workflow (`.github/workflows/deploy-database.yml`)
applies pending migrations to the live Supabase project and loads the course
content, without anyone installing the Supabase CLI or `psql`. It never runs by
itself: it only runs when started by hand from the Actions tab.

## One-time setup: add the connection string as a secret

1. **Copy the connection string.** In the Supabase dashboard, open your
   project, click **Connect** (top of the page), and copy the **Session
   pooler** string. It looks like:

   ```
   postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```

   Use the *Session pooler* one: GitHub's machines can't reach the "Direct
   connection" host (it is IPv6-only).

2. **Put your database password in it**, replacing `[YOUR-PASSWORD]` including
   the brackets. If you have forgotten it, reset it under Project Settings →
   Database. If the password contains special characters, percent-encode them
   (`@` → `%40`, `#` → `%23`, `/` → `%2F`, `:` → `%3A`, `?` → `%3F`,
   `&` → `%26`, `%` → `%25`), or reset it to one made of letters and digits.

3. **Save it in GitHub.** In the repository: **Settings → Secrets and
   variables → Actions → New repository secret**.
   - Name: `SUPABASE_DB_URL`
   - Secret: the full connection string from step 2

   GitHub hides the value everywhere afterwards, including in workflow logs.

4. *(Optional)* To require your approval before every run: **Settings →
   Environments → supabase-production → Required reviewers** (the
   environment appears after the first run).

## Running it

**Actions → Deploy database → Run workflow**, then:

| Option | What it does |
| --- | --- |
| **Use workflow from** (branch) | The branch whose migrations get applied. Pick **main** unless you are testing something. A branch that is behind the database makes the run stop with an explanation and change nothing. |
| **1. Dry run** (on by default) | A rehearsal: shows which migrations and content files would run and changes nothing. Always run it first, then run again with it off. |
| **2. Also load the course content** (on by default) | After the migrations, runs `supabase/seed/001*_learn_*.sql`. Safe to repeat: it updates rows in place, never duplicates them. |
| **3. mark_applied_through** (empty by default) | Leave empty. Only fill it in if a run stopped and asked for it (see below). |

The top of every run's summary repeats the branch and the options used, so you
can tell afterwards what a run was.

### If a run stops

| Message | Meaning | What to do |
| --- | --- | --- |
| *this branch is behind the database* | The database has migrations that your branch lacks, because they were deployed from a newer branch. | Run again from **main**, or merge `main` into the branch. |
| *the database has tables but no migration history* | The earlier migrations were pasted into the SQL editor. | Set **mark_applied_through** as described below. |

Each run ends with a summary on the run's page: how many texts each language
has and how many lessons are active.

### First run on this project

1. Run it with **Dry run** ticked.
2. If it stops with *"the database has tables but no migration history"*,
   the earlier migrations were pasted into the SQL editor rather than pushed
   with the CLI, so Supabase has no record of them. Run it again (still a dry
   run) with **mark_applied_through** set to `9998`, the last migration from
   before the learning course. The summary should then say it would apply
   exactly these seven:
   - `99990_learning_enums.sql`
   - `99991_content_engine_tables.sql`
   - `99992_content_engine_rls_indexes.sql`
   - `99993_content_engine_functions.sql`
   - `99994_security_lint_fixes.sql`
   - `99995_learn_query_performance.sql`
   - `99996_xp_leaderboard.sql`
3. Run it for real: untick **Dry run** and keep the same
   **mark_applied_through** value if you needed it in step 2.
4. The summary should show **1,106** texts for each of de, en, es, nl and tr,
   and **173** active lessons. The **Learn** tab in the app now shows the
   course.

After that first run, leave **mark_applied_through** empty for good: the
history is recorded, and later runs apply only new migrations.

### Later

Whenever a PR adds a migration or changes content under `content/` (and its
regenerated seed files), merge it, then run the workflow again: dry run first,
then for real.

## Knowing when the database is behind

The web app goes live the moment a pull request is merged, but the database only
changes when you run **Deploy database**. The **Database check** workflow
(`.github/workflows/database-check.yml`) tells you when the two disagree. It only
reads; it never changes anything, and it does nothing if the `SUPABASE_DB_URL`
secret is not set.

**What you will see, and what to do**

| You see | It means | You do |
| --- | --- | --- |
| Green "Database check" | The live database already has every migration in this branch. | Nothing. |
| Red "Database check" on a **pull request** | This pull request adds a migration that is not in the live database yet. That is normal for a pull request that changes the database. | Merge it, then run the steps below. |
| Red "Database check" on **main** | `main` has migrations the live database does not. The app may be using tables or functions that are not there yet. | Run the steps below now. |

**Steps to bring the database up to date** (about two minutes)

1. GitHub → **Actions** → **Deploy database** → **Run workflow**.
2. *Use workflow from*: choose **main**.
3. Leave **Dry run** ticked and press the green button. Open the run: it lists
   what would change and changes nothing. If it stops with an explanation, read it;
   it never breaks anything.
4. Run it again with **Dry run** unticked. This is the real one.
5. Open **Actions → Database check → Run workflow**: it should turn green.

Rule of thumb: when several pull requests change the database, merge them all
first and run Deploy database once, from `main`.

The check on pull requests uses the production connection string, which a pull
request could in principle read by editing the workflow. That is fine while only
you and trusted agents push to this repository. If that ever changes, create a
read-only database user for the check and store its URL as a separate secret.

After a real deploy, `deploy.sh` also confirms nothing is left pending and asks
PostgREST to reload its schema cache, so newly created functions are callable
straight away.

## What it does not do

- It does not run the original seeds `supabase/seed/0001`–`0007` (languages,
  interests, missions, the old challenge content). Those were loaded when the
  project was set up and are not safe to re-run. A brand-new Supabase project
  still follows the README's setup steps first.
- It does not deploy the website; Vercel does that on its own.

## Running the same thing from a terminal

The workflow calls `scripts/db/deploy.sh`, which works locally too
(needs the Supabase CLI and `psql`):

```bash
SUPABASE_DB_URL='postgresql://…' DRY_RUN=true scripts/db/deploy.sh
```
