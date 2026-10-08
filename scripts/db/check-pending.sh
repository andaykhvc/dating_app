#!/usr/bin/env bash
# Fails if a migration in supabase/migrations/ has not been applied to the
# database at $SUPABASE_DB_URL. Read-only: it only SELECTs the history table the
# Supabase CLI keeps (supabase_migrations.schema_migrations).
#
#   SUPABASE_DB_URL='postgresql://…' scripts/db/check-pending.sh
#
# Exit codes: 0 everything applied · 1 something pending · 2 could not check.
#
# Why it exists: the web app deploys on merge but the database only changes
# when someone runs the "Deploy database" workflow, so code can go live before
# the schema it needs. This makes that gap visible (see
# .github/workflows/database-check.yml) and double-checks a deploy afterwards.
set -euo pipefail
cd "$(dirname "$0")/../.."

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "SUPABASE_DB_URL is not set (see docs/deploying-the-database.md)." >&2
  exit 2
fi
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/null}"
say() { echo "$*"; echo "$*" >> "$SUMMARY"; }

if ! applied=$(psql "$SUPABASE_DB_URL" -X -q -At -v ON_ERROR_STOP=1 \
  -c "select version from supabase_migrations.schema_migrations order by version" 2>&1); then
  say "### ✗ Could not read the migration history"
  say '```'
  say "$applied"
  say '```'
  say "Check the connection string, or that the database has been deployed at least once."
  exit 2
fi

pending=()
total=0
for f in supabase/migrations/*.sql; do
  v=$(basename "$f" | cut -d_ -f1)
  total=$((total + 1))
  grep -qx "$v" <<< "$applied" || pending+=("$(basename "$f")")
done

if [ "${#pending[@]}" -eq 0 ]; then
  say "### ✓ All $total migrations are applied to the database"
  exit 0
fi

say "### ✗ ${#pending[@]} migration(s) are NOT applied to the live database"
say ""
for p in "${pending[@]}"; do say "- \`$p\`"; done
say ""
say "The code on \`${GITHUB_REF_NAME:-this branch}\` may expect schema the database does not have yet."
say "Run **Actions → Deploy database → Run workflow** (start with *dry run* on, from \`main\`)."
exit 1
