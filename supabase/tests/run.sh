#!/usr/bin/env bash
# Runs every migration and seed against a throwaway local Postgres database,
# then the SQL test files in this folder. No Supabase project or Docker needed:
#
#   PGHOST=/tmp PGPORT=5432 PGUSER=postgres supabase/tests/run.sh
#
# The database named by $TEST_DB (default lingua_match_test) is dropped and
# recreated on every run.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB="${TEST_DB:-lingua_match_test}"
PSQL=(psql -X -q -v ON_ERROR_STOP=1)

"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB"
"${PSQL[@]}" -d "$DB" -f supabase/tests/supabase_shim.sql >/dev/null 2>&1

for f in $(ls supabase/migrations/*.sql | sort); do
  "${PSQL[@]}" -d "$DB" -1 -f "$f" >/dev/null || { echo "✗ migration $f"; exit 1; }
done
for f in $(ls supabase/seed/*.sql | sort); do
  "${PSQL[@]}" -d "$DB" -1 -f "$f" >/dev/null || { echo "✗ seed $f"; exit 1; }
done
# Freshly loaded tables have no planner statistics until autovacuum gets to
# them, and lesson generation on empty statistics is ~20x slower.
"${PSQL[@]}" -d "$DB" -c "analyze" >/dev/null
echo "✓ migrations and seeds applied"

for f in supabase/tests/test_*.sql; do
  "${PSQL[@]}" -d "$DB" -f "$f" || { echo "✗ $f"; exit 1; }
  echo "✓ $f"
done
