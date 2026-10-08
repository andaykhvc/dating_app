# Moving the app to your own domain

The app currently lives on `dating-app-ruddy.vercel.app` (the "old" host). This
page is the checklist for moving it to a domain you own without silently
breaking sign-in, OAuth or the Android app.

## How the site knows its own address

| Where | Mechanism |
| :--- | :--- |
| Web app (auth emails, OAuth return, absolute metadata URLs) | `NEXT_PUBLIC_SITE_URL`, read through `src/lib/site.ts`. Unset, it falls back to the origin of the current page/request, then Vercel's production host, then `http://localhost:3000`. |
| Android app (Trusted Web Activity) | `android/twa-manifest.json` holds the committed host. `SITE_HOST` (env var, workflow input, or repository variable) overrides it when the APK is generated. |
| Supabase Auth | Dashboard setting (below). Not in the repo. |

`NEXT_PUBLIC_*` values are compiled into the web build: after changing
`NEXT_PUBLIC_SITE_URL`, redeploy.

## Checklist (human steps, in order)

1. **Buy the domain** and decide the address the app will use (for example
   `https://app.example.com`).
2. **Vercel**: Project → Settings → Domains → add the domain and set the DNS
   records Vercel shows at your registrar. Wait until Vercel reports it valid
   (HTTPS certificate issued).
3. **Vercel environment variable**: add `NEXT_PUBLIC_SITE_URL=https://app.example.com`
   (Production) and redeploy.
4. **Supabase Dashboard → Authentication → URL Configuration**
   - Site URL: `https://app.example.com`
   - Redirect URLs: add `https://app.example.com/auth/callback`
     (keep the old host's entry until the move is finished so emails that were
     already sent still work).
5. **OAuth providers** (Google, later Apple): add the new origin as an
   authorised JavaScript origin where the provider asks for one. The provider's
   redirect URI points at Supabase (`https://<project>.supabase.co/auth/v1/callback`)
   and does **not** change with the app's domain.
6. **Check `https://app.example.com/.well-known/assetlinks.json`** loads (it is
   served from `public/.well-known/assetlinks.json`). The Android app only opens
   full-screen, without a URL bar, when this file is reachable on the host it opens.
7. **Android: release a new APK.** The host is baked into the app, so installed
   copies keep opening the old host until people install a new build.
   - GitHub → Actions → **Android APK** → Run workflow, with `site_host` set to
     `app.example.com` (or set the repository variable `SITE_HOST` once and leave
     the input blank). The new host must already be live: generating the project
     downloads the icons from it.
   - To make the new host the committed default afterwards, edit the five host
     fields in `android/twa-manifest.json` (`host`, `iconUrl`, `maskableIconUrl`,
     `webManifestUrl`, `fullScopeUrl`).
   - Keep the old domain working (redirect to the new one) for as long as old
     APKs are installed.
8. Smoke test on the new domain: sign up with a fresh email and follow the link,
   sign in with Google, open the Android app.

## Where the old host still appears

`grep -rn "dating-app-ruddy" .` (excluding `node_modules`) lists only:

- `android/twa-manifest.json`: the committed Android default (intentionally left
  unchanged until the new domain is live).
- `README.md` and this page: documentation of the old value.

The release notes in `.github/workflows/android-release.yml` read the host from
`SITE_HOST` or `android/twa-manifest.json`; nothing in the web app's source
hardcodes it.
