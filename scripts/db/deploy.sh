#!/usr/bin/env bash
# Applies pending migrations and (optionally) the course content seeds to a
# Supabase database. Run by .github/workflows/deploy-database.yml; can also be
# run by hand from the repo root:
#
#   SUPABASE_DB_URL='postgresql://…' scripts/db/deploy.sh
#
# Environment:
#   SUPABASE_DB_URL          session-pooler connection string, password
#                            percent-encoded (required)
#   DRY_RUN=true             show what would happen, change nothing
#   SEED_COURSE=true|false   run supabase/seed/001*_learn_*.sql after
#                            migrating (default true; safe to re-run)
#   MARK_APPLIED_THROUGH=v   one-time fix for a database whose schema was
#                            created by pasting migrations into the SQL editor:
#                            record every local migration up to and including
#                            version v as already applied before pushing
#   SUPABASE=<cmd>           Supabase CLI command (default: supabase)
set -euo pipefail
cd "$(dirname "$0")/../.."

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL to the database connection string}"
DRY_RUN="${DRY_RUN:-false}"
SEED_COURSE="${SEED_COURSE:-true}"
MARK_APPLIED_THROUGH="${MARK_APPLIED_THROUGH:-}"
SUPABASE="${SUPABASE:-supabase}"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/null}"

scripts/db/check-migration-versions.sh

versions=()
psql_q() { psql "$SUPABASE_DB_URL" -X -q -At -v ON_ERROR_STOP=1 -c "$1"; }
say() { echo "$*"; echo "$*" >> "$SUMMARY"; }

say "## Database deploy"
say ""
say "| Setting | Value |"
say "| --- | --- |"
say "| Branch | \`${GITHUB_REF_NAME:-local}\` |"
if [ "$DRY_RUN" = "true" ]; then
  say "| Mode | **Dry run**: shows what would happen, changes nothing |"
else
  say "| Mode | **Real run**: changes the live database |"
fi
say "| Load course content | $SEED_COURSE |"
say "| mark_applied_through | ${MARK_APPLIED_THROUGH:-(not used)} |"
say ""

echo "::group::Database state"
schema_exists=$(psql_q "select to_regclass('public.profiles') is not null")
history_exists=$(psql_q "select to_regclass('supabase_migrations.schema_migrations') is not null")
recorded=0
if [ "$history_exists" = "t" ]; then
  recorded=$(psql_q "select count(*) from supabase_migrations.schema_migrations")
fi
echo "app schema present: $schema_exists; migrations recorded: $recorded"
echo "::endgroup::"

# The database may already hold migrations this branch does not have: they
# were deployed from a newer branch (usually main). Pushing from an older
# branch would fail with a confusing CLI error, so say what is wrong instead.
if [ "$history_exists" = "t" ] && [ "$recorded" != "0" ]; then
  missing=()
  while IFS= read -r v; do
    [ -n "$v" ] || continue
    ls supabase/migrations/"${v}"_*.sql > /dev/null 2>&1 || missing+=("$v")
  done < <(psql_q "select version from supabase_migrations.schema_migrations order by version")
  if [ "${#missing[@]}" -gt 0 ]; then
    say "### ✗ Stopped: this branch is behind the database"
    say "The database already has these migrations, but branch \`${GITHUB_REF_NAME:-local}\` does not: **${missing[*]}**."
    say ""
    say "They were deployed from a newer branch (normally \`main\`). Nothing was changed."
    say "**Fix:** run the workflow again and pick **main** in the *Use workflow from* dropdown,"
    say "or merge \`main\` into this branch first. Do not use \`supabase migration repair\`."
    exit 1
  fi
fi

# A schema with no migration history means the migrations were applied by
# hand. `db push` would then try to run all of them again and fail halfway,
# so stop unless told which versions are already in place.
if [ "$schema_exists" = "t" ] && [ "$recorded" = "0" ]; then
  if [ -z "$MARK_APPLIED_THROUGH" ]; then
    say "### ✗ Stopped: the database has tables but no migration history"
    say "The earlier migrations were probably pasted into the SQL editor. Re-run this workflow with"
    say "**mark_applied_through** set to the last migration that is already in the database"
    say "(for this project, before the learning course: \`9998\`)."
    exit 1
  fi
  for f in supabase/migrations/*.sql; do
    v=$(basename "$f" | cut -d_ -f1)
    # Same string order the CLI uses to sort migrations.
    if [[ ! "$v" > "$MARK_APPLIED_THROUGH" ]]; then versions+=("$v"); fi
  done
  if [ "${#versions[@]}" -eq 0 ]; then
    echo "No local migration is at or before $MARK_APPLIED_THROUGH" >&2
    exit 1
  fi
  say "Recording as already applied: ${versions[*]}"
  if [ "$DRY_RUN" != "true" ]; then
    $SUPABASE migration repair --db-url "$SUPABASE_DB_URL" --status applied "${versions[@]}"
  fi
fi

echo "::group::Migrations"
if [ "$DRY_RUN" = "true" ] && [ "${#versions[@]}" -gt 0 ]; then
  # The history was not recorded (dry run), so the CLI would list every
  # migration as pending. Show what the real run would apply instead.
  say "Would then apply:"
  for f in supabase/migrations/*.sql; do
    v=$(basename "$f" | cut -d_ -f1)
    if [[ "$v" > "$MARK_APPLIED_THROUGH" ]]; then say "- $(basename "$f")"; fi
  done
else
  $SUPABASE migration list --db-url "$SUPABASE_DB_URL" || true
  # --include-all: the legacy 9999x numbering has run out of room, so newer
  # migrations carry a timestamp version that sorts *before* the ones already
  # applied. Without this flag the CLI refuses them as "out of order".
  if [ "$DRY_RUN" = "true" ]; then
    $SUPABASE db push --db-url "$SUPABASE_DB_URL" --include-all --dry-run
  else
    $SUPABASE db push --db-url "$SUPABASE_DB_URL" --include-all
  fi
fi
echo "::endgroup::"

if [ "$SEED_COURSE" = "true" ]; then
  echo "::group::Course content"
  # Globs expand in sorted order, which is the order the files must run in.
  for f in supabase/seed/001*_learn_*.sql; do
    if [ "$DRY_RUN" = "true" ]; then
      echo "would run $f"
    else
      echo "running $f"
      # One transaction per file: a failure leaves that file's changes out entirely.
      psql "$SUPABASE_DB_URL" -X -q -1 -v ON_ERROR_STOP=1 -f "$f" > /dev/null
    fi
  done
  if [ "$DRY_RUN" != "true" ]; then
    # Fresh rows have no planner statistics until autovacuum catches up, and
    # lesson generation on stale statistics is ~20x slower.
    psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 \
      -c "analyze concepts, concept_translations, lesson_concepts, lessons, skills, units" > /dev/null
  fi
  echo "::endgroup::"
fi

if [ "$DRY_RUN" = "true" ]; then
  say "### Dry run: nothing was changed"
  exit 0
fi

# Proof, not hope: nothing may be left pending after a real run.
scripts/db/check-pending.sh

# PostgREST caches function signatures. Supabase normally refreshes it after
# DDL, but if it misses one the new functions answer 404, which looks exactly
# like the migration not having run. Asking again is harmless.
psql_q "notify pgrst, 'reload schema'" > /dev/null
echo "PostgREST schema cache reload requested"

if [ "$(psql_q "select to_regclass('public.concept_translations') is not null")" = "t" ]; then
  say "### ✓ Database updated"
  say ""
  say "| Language | Texts |"
  say "| --- | --- |"
  psql_q "select language_code || '|' || count(*) from concept_translations where status = 'active' group by language_code order by language_code" \
    | while IFS='|' read -r lang n; do say "| $lang | $n |"; done
  say ""
  say "Active lessons: $(psql_q "select count(*) from lessons where is_active")"
else
  say "### ✓ Migrations applied (course tables not present yet)"
fi
