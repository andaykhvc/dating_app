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
