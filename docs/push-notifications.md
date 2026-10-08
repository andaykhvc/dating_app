# Push notifications

Opt-in web push through Firebase Cloud Messaging (FCM): a person turns
notifications on in **Settings → Notifications**, the device's token is stored,
and the server (next step, issue #24) sends to it.

## Setup (human steps)

1. Create a Firebase project and add a **Web app**.
2. Cloud Messaging → **Web Push certificates** → generate the key pair (VAPID).
3. Set these environment variables in Vercel (Production, and Preview if you test
   there), then redeploy; they are public by design (`NEXT_PUBLIC_*`):

   | Variable | Where to find it |
   | :--- | :--- |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app config `apiKey` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |
   | `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | The Web Push certificate's public key |

**With any of these unset the feature hides itself**: no card in Settings, the
Firebase SDK is never loaded, nothing errors.

## Architecture

- `src/features/push/config.ts`: reads the variables; returns `null` unless all
  five are set.
- `src/features/push/usePushNotifications.ts`: support check, permission state,
  `enable()` / `disable()`. **Nothing is requested on page load**: the browser's
  permission prompt appears only when the person taps the switch. The Firebase SDK
  (`firebase/app`, `firebase/messaging`) is imported lazily inside `enable()` /
  `disable()`, so it is not in the main bundle.
- `src/features/push/PushNotificationsCard.tsx`: the Settings card with states
  *unsupported*, *blocked in browser settings*, *off*, *on*.
- `public/firebase-messaging-sw.js`: the service worker. It handles the standard
  `push` event itself (title/body from `data.title` / `data.body` or a
  `notification` object) and opens `data.url` on click, restricted to same-site
  paths. It needs no Firebase library. A static file cannot read `process.env`, so
  the public web config is passed in the registration URL
  (`/firebase-messaging-sw.js?apiKey=...`), which `serviceWorkerUrl()` builds; the
  VAPID key is not part of it.
- `push_tokens` table (`supabase/migrations/999996_push_tokens.sql`): one row per
  device token. A signed-in user can read and delete only their own rows. Tokens
  are written through `register_push_token()` (security definer) so that when a
  different person signs in on the same browser the row *moves* to them instead of
  failing on the unique token. `last_seen_at` is refreshed on re-registration.

## Android app (Trusted Web Activity)

`android/twa-manifest.json` has `enableNotifications: true`. The TWA delegates
notifications to Chrome, so it uses this same web-push flow: the toggle works
inside the app as it does in the browser, and no separate Android push setup is
needed. Not verified on a device yet; check once with the installed APK.

## iPhone / iPad

Web push on iOS works only for a site added to the Home Screen (iOS 16.4+). In a
normal Safari tab the card says notifications are not available.

## Verifying (human, with Firebase configured)

1. Open Settings on a supported browser; the Notifications card appears.
2. Tap the switch, allow the prompt: one `push_tokens` row appears for your user
   (`select * from push_tokens`).
3. Tap again: the row is deleted.
4. Block notifications in the browser and reload: the card shows the blocked text.

What was tested without Firebase: the database rules (`npm run test:db`,
`test_push_tokens.sql`: cross-user reads/deletes fail, token hand-off, no direct
insert/update), the config parsing (`npm test`: unset or blank variables give `null`, which makes the hook report
*unconfigured* and the card render nothing). The Settings page itself sits behind
sign-in, so it was not exercised in a browser here.

## Sending (new messages and matches)

### How it works

1. A trigger on `messages` and one on `matches` call `send_push_webhook()`, which
   posts `{ kind, id }` (and, for matches, `exclude_user`) to the **`send-push`**
   Edge Function through `pg_net`, with a shared secret in `x-webhook-secret`.
   Only an id is sent: **no message text ever leaves the database for this.**
2. `send-push` asks `get_push_targets()` who to notify. The rules are in SQL
   (`supabase/migrations/999997_push_send.sql`) and tested there:
   - never the sender; only the other person in the match;
   - nothing when the match is not active, or either person blocked the other;
   - only accounts that are active, and only that person's own tokens;
   - for a new match, not the person who just completed it (inside `record_swipe`
     the caller is that person, so `auth.uid()` identifies them); they already see
     the match celebration.
3. The function builds a generic data-only message and sends it with the **FCM
   HTTP v1** API (OAuth2 access token from the service account, signed with Web
   Crypto; not the deprecated legacy key API).
   - message: title = sender's first name, body = "Sent you a message"
   - match: title = "Lingua Match", body = "You have a new language partner"
   - `data.url` = `/messages/<matchId>`, used by the service worker on click.
4. Tokens FCM reports as `UNREGISTERED` / `NOT_FOUND` are deleted from
   `push_tokens`. A failure on one token does not stop the others.

**Why triggers + `pg_net` instead of Supabase Database Webhooks:** the trigger
lives in a migration, so it is reviewed in PRs, versioned, and exercised by the
same tests as the rest of the schema; Database Webhooks are configured in the
dashboard, outside the repo. The decision "who is told" also needs `auth.uid()` at
match time, which only SQL has.

### Deploy (human steps)

1. Firebase console → Project settings → Service accounts → generate a key.
2. Secrets (never commit them):

   ```bash
   supabase secrets set \
     FCM_SERVICE_ACCOUNT_JSON="$(cat service-account.json)" \
     PUSH_WEBHOOK_SECRET='<long random string>'
   ```

3. `supabase functions deploy send-push` (JWT verification is off in
   `supabase/config.toml`; the function authenticates callers by the secret).
4. Point the database at it (SQL editor), with the same secret:

   ```sql
   insert into push_settings (key, value) values
     ('webhook_url',    'https://<project ref>.supabase.co/functions/v1/send-push'),
     ('webhook_secret', '<the same long random string>');
   ```

   Make sure the `pg_net` extension is enabled (Database → Extensions).

Without the settings row the triggers do nothing and the app behaves as before.

### Test it by hand

- Turn notifications on for user B in Settings (see "Verifying" above), then send
  B a message from user A: B's device shows "A: Sent you a message".
- Call the function directly; without the header it must answer 401:

  ```bash
  curl -i -X POST https://<ref>.supabase.co/functions/v1/send-push \
    -H 'content-type: application/json' -d '{"kind":"message","id":"1"}'
  ```

### What is tested

`npm run test:db` (`test_push_send.sql`): sender excluded, blocked pairs and ended
matches excluded, only the recipient's tokens, no message text in the targets,
match push excludes the person who completed it, no API role can call
`get_push_targets` or read the webhook secret, and inserting messages works with
no webhook configured. `npm test` (`send-push.test.ts`): payloads are generic, the
FCM JWT is signed correctly (verified against the public key), tokens are
cached, `UNREGISTERED` maps to deletion, the shared secret is required.
**Not tested here:** real delivery through FCM (needs a Firebase project and a
device) and the `pg_net` call itself (the local test database has no `pg_net`).
