# "Download my data"

Settings → **Download my data** saves a JSON file with the personal data held
about the signed-in user (GDPR Art. 15 access / Art. 20 portability).

## How it works

- `GET /api/account/export` (`src/app/api/account/export/route.ts`). Signed-out
  requests get **401** (the proxy answers `/api/*` itself instead of redirecting
  to the login page). The response is `Content-Disposition: attachment` with
  `Cache-Control: no-store`.
- Data is read with the **user's own session**, never the service role, so
  row-level security decides what each table returns. Where a policy also lets a
  match partner read rows (`game_sessions`), the route filters to the user's own.
- Two things RLS hides from clients come from narrow SQL functions
  (`supabase/migrations/99998_data_export.sql`): the partner's **first name only**
  for each match, and the user's lesson history **without the answer-key column**.
- What is included is defined in one place, `src/lib/account-export.ts`. The
  file's `_about` section lists what is included and excluded and why.

## Adding a table

`npm test` fails if a table in `supabase/migrations` is in neither `EXPORT_TABLES`
nor `EXCLUDED_TABLES` (with a reason). New personal-data tables (push tokens,
consent records, ...) therefore have to be added deliberately.

## Limits

- **Rate limit:** one export per minute per user, stored in
  `data_export_requests` (database-backed, so it holds across serverless
  instances; an in-memory counter would reset per instance). The route answers 429
  with `Retry-After`.
- **Size cap:** 50,000 rows per table (`EXPORT_MAX_ROWS_PER_TABLE`), read in pages
  of 1,000. A table that hits the cap is listed in `_about.truncated_tables`. The
  document is built in memory, which is fine for normal accounts; an account with
  hundreds of thousands of messages would need a streamed export.
- **Photos:** the JSON lists each photo with its URL; the image files are
  separate downloads.
- **Android app (Trusted Web Activity):** the button downloads via `fetch` and a
  temporary `<a download>` link. Not verified inside the TWA yet: check once on a
  device with the installed APK. If Chrome's TWA blocks it, the fallback is to
  open `/api/account/export` in the browser.
