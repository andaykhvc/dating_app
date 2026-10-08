# Sign-up emails: Brevo and the 6-digit code

New accounts confirm their email with a **6-digit code** that they type into the
app (screen: *Enter your code*). The email is sent through **Brevo**, because
Supabase's built-in mailer only allows about **2 emails per hour for the whole
project**, which is nothing on launch night.

You do four things in dashboards; the code is already in the app.

## 1. A domain you own (do this first)

Emails must come from an address on a domain you control, e.g.
`no-reply@yourdomain.com`. Do **not** send from a `gmail.com` or `outlook.com`
address: Gmail and others reject or spam-folder it. The domain does not have to
be the website's address. If you have no domain yet, buy one (about €10/year);
you will need access to its DNS settings.

## 2. Brevo

1. Create an account at brevo.com.
2. **Senders, domains** → add your domain → Brevo shows DNS records to add at your
   domain registrar: **SPF** (a TXT record), **DKIM** (a TXT record) and it asks
   for a **DMARC** record (TXT `_dmarc`, e.g. `v=DMARC1; p=none; rua=mailto:you@yourdomain.com`).
   Add them, then press *Authenticate*. It can take from minutes to a few hours.
3. **SMTP & API** → **SMTP** → copy the **server, port, login** and create an
   **SMTP key** (this is the password; copy it now, it is shown once).

### Limits: do the sum before launch night

The free Brevo plan sends **300 emails per day**
([source](https://www.brevo.com/free-smtp-server)). Every sign-up costs at least
1 email, and every "send a new code" another. If you expect 500 people to sign up
on a day, the free plan is not enough: upgrade Brevo's plan **before** that day
(paid plans remove the daily cap; check Brevo's pricing page for the current price
and limits). People who hit the limit see no email and cannot get in.

## 3. Supabase → Authentication

1. **Authentication → Emails → SMTP settings** (the exact menu names change; look
   for "SMTP"): turn on **custom SMTP** and enter the values from Brevo:
   host, port (usually 587), username, password (the SMTP key), and the sender
   name ("Lingua Match") and sender address (`no-reply@yourdomain.com`).
2. **Authentication → Rate Limits**: raise **emails sent per hour** above what you
   expect (custom SMTP starts at a low number). For 300 sign-ups in an hour set it
   to at least 400, since resends count too.
3. **Authentication → Emails → Templates → Confirm signup**: set the **subject** to
   `Dein Code / Your code: {{ .Token }}` and paste the whole content of
   `supabase/templates/confirm-signup.html` into the body. The code comes from
   `{{ .Token }}`; that is what makes it a code instead of a link.
4. **Authentication → Sign In / Providers → Email**: keep **Confirm email** on.
   Email OTP length should be **6** and expiry **3600** seconds.

## 4. Test it (about 5 minutes; do it today, not on launch night)

1. Open the app on your phone, sign up with an address you can read.
2. The email should arrive within a minute with a 6-digit code (German on top,
   English below). Check it is **not in spam**; if it is, DNS (step 2) is not
   finished or the sender domain is wrong.
3. Type the code. After the sixth digit you land in onboarding.
4. Try *Send a new code*: it should wait 60 seconds, then send a new code; the old
   one stops working.
5. Try a wrong code: you see "That code is wrong or has expired".

If a user closes the app before entering the code, they can sign in later with
their password: the app sends a fresh code and shows the code screen.

## What the app does, for reference

- Sign-up (`SignupForm`) → `supabase.auth.signUp` → *Enter your code*
  (`VerifyEmailForm`) → `auth.verifyOtp({ email, token, type: "signup" })`.
- The email address is kept in `sessionStorage` for that tab only, not in the URL.
- Old confirmation links (`/auth/callback`) still work for emails sent before the
  switch; the new template does not contain a link.
- SMS codes are not used (Brevo can send SMS, but it costs per message and would
  need phone numbers).
