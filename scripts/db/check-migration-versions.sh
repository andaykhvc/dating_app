#!/usr/bin/env bash
# Supabase stores the filename prefix as the migration primary key. Two files
# with the same prefix can both pass review on separate branches, but the
# second one fails only after `db push` has begun applying migrations.
set -euo pipefail

cd "$(dirname "$0")/../.."
migrations_dir="${1:-supabase/migrations}"

if [ ! -d "$migrations_dir" ]; then
  echo "Migration directory does not exist: $migrations_dir" >&2
  exit 1
fi

duplicates=$(
  for file in "$migrations_dir"/*.sql; do
    basename "$file" | cut -d_ -f1
  done | sort | uniq -d
)

if [ -z "$duplicates" ]; then
  echo "Migration versions are unique."
  exit 0
fi

echo "Duplicate Supabase migration version(s):" >&2
while IFS= read -r version; do
  [ -n "$version" ] || continue
  echo "  $version" >&2
  for file in "$migrations_dir"/"${version}"_*.sql; do
    echo "    - $file" >&2
  done
done <<< "$duplicates"
echo "Rename each migration so every filename prefix is unique before deploying." >&2
exit 1
