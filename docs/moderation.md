# Automatic photo moderation

New profile photos are checked automatically within seconds. Clear nudity is
rejected, clearly fine photos are approved, and anything uncertain waits for a
person (see [the manual runbook](compliance/moderation-runbook.md)). It is
**fail-closed**: an error, a timeout or an odd answer never approves a photo.

## How it works

1. A photo row is inserted into `profile_photos` (or its file is replaced) as
   `pending`.
2. A database trigger (`request_photo_moderation`, via `pg_net`) posts
   `{ "photo_id": ... }` to the `moderate-photo` Edge Function with a shared secret.
3. The function (`supabase/functions/moderate-photo/`) downloads the file with the
   service role, sends the bytes to the provider and maps the labels to a verdict:
   - `unsafe` -> `reject_photo(..., 'auto')` and the files are deleted from Storage,
   - `safe` -> `approve_photo(..., 'auto')`,
   - `review`, an error, a timeout, a file over 2 MB, a missing API key or a user
     over the daily cap -> stays `pending` for manual review.
4. Both functions only act on photos that are still `pending`, so a duplicate
   webhook or a moderator who got there first wins.

Image bytes are never written to logs. `photo_moderation_events` stores ids,
labels and scores only.

## Provider decision

Prices checked against the providers' pages on 2026-10-08 (verify again before
signing up; they change).

| | Amazon Rekognition (**chosen**) | Google Cloud Vision SafeSearch | Sightengine |
| :--- | :--- | :--- | :--- |
| Price per 1,000 images | $1.00 (first 1M), then $0.80 / $0.60 | $1.50 (first 1,000/month free) | $2.00 over plan; plans from $29/month for 10,000 |
| Free tier | 1,000 images/month for the first 12 months | 1,000/month | 2,000/month, max 500/day |
| What is sent | Image bytes (we send the file; limit 5 MB, ours is 2 MB) | Bytes or a URL | Bytes or a URL |
| Where processed | The AWS region you call: **eu-west-1 (Ireland)** is selectable | Google regional endpoints exist; Vision-specific EU residency not confirmed | Company is French; processing region is a plan setting, EU routing documented for Enterprise; sub-processors include US providers |
| DPA / GDPR | AWS GDPR DPA is part of the AWS service terms (accept/confirm in AWS Artifact) | Google Cloud DPA | Sign their DPA and email it to support |
| Latency | ~1 s | ~1 s | ~1 s |
| Limits | Soft per-account TPS limits, no daily cap | Quotas per minute | Free tier 500/day: one busy launch evening would exceed it |
| Dating-app use | Allowed (content moderation is a core use case) | Allowed | Allowed |

**Self-hosted open model** (an NSFW classifier inside the Edge Function): not
recommended. Edge Functions have tight CPU/memory limits and no GPU, model files
would have to ship with the function, and accuracy would be ours to maintain.
A hosted API costs about $1 per 1,000 photos, which is cheaper than the time.

**Recommendation: Amazon Rekognition in `eu-west-1`.** It is the cheapest option
that lets us *choose and verify* EU processing, has a standard DPA, no daily cap,
and a free tier that covers the first thousand photos. Sightengine is the easiest
to integrate but its free tier's daily cap and unclear default region are a poor
fit for a launch evening. Adding another provider later means one new adapter
file implementing `ModerationProvider` (`providers/`).

Cost estimate: 1,000 new users with three photos each is about 3,000 checks,
roughly **$2-3** after the free tier.

## Setup (human steps)

1. **AWS**: create an account, then an IAM user whose only permission is
   `rekognition:DetectModerationLabels`; create an access key. Confirm the AWS GDPR
   DPA is in force for your account (AWS Artifact) and that the Rekognition region
   is `eu-west-1`.
2. **Secrets** (never commit these):

   ```bash
   supabase secrets set \
     MODERATION_MODE=shadow \
     MODERATION_REGION=eu-west-1 \
     MODERATION_API_KEY='<access key id>:<secret access key>' \
     MODERATION_WEBHOOK_SECRET='<long random string>'
   ```

3. **Deploy**: `supabase functions deploy moderate-photo` (JWT verification is off
   in `supabase/config.toml`; the function authenticates callers by the secret).
4. **Tell the database where to send the webhook** (SQL editor):

   ```sql
   insert into moderation_settings (key, value) values
     ('webhook_url',    'https://<project ref>.supabase.co/functions/v1/moderate-photo'),
     ('webhook_secret', '<the same long random string>');
   ```

   Make sure the `pg_net` extension is enabled (Database -> Extensions).
5. Run in **shadow** for the first week, then switch (below).

## Modes

`MODERATION_MODE` (a function secret; changing it takes effect on the next call):

| Mode | Behaviour |
| :--- | :--- |
| `off` (default) | Does nothing; everything is manual. |
| `shadow` | Calls the provider and records what it *would* do in `photo_moderation_events`; no photo changes status. |
| `enforce` | Approves, rejects and leaves uncertain photos pending. |

`supabase secrets set MODERATION_MODE=enforce`

## Thresholds and tuning

All numbers live in `supabase/functions/moderate-photo/thresholds.ts`: a score
(0-100) per top-level category at which a photo is rejected (`REJECT_AT`) or sent
to a person (`REVIEW_AT`), the daily per-user cap (20 calls) and the size limit
(2 MB). Ordinary swimwear is deliberately *not* a trigger.

Review the shadow log:

```sql
-- What would have happened, by verdict
select verdict, outcome, count(*) from photo_moderation_events
where mode = 'shadow' group by 1, 2 order by 3 desc;

-- Photos it wanted to reject or hold, with scores, next to the manual decision
select e.created_at, e.verdict, e.scores, p.moderation_status as manual_status, p.storage_path
from photo_moderation_events e
join profile_photos p on p.id = e.photo_id
where e.mode = 'shadow' and e.verdict in ('unsafe', 'review')
order by e.created_at desc;
```

If a safe photo would have been rejected, raise that category's `REJECT_AT`; if
something bad would have been approved, lower it or add a category to `REVIEW_AT`,
redeploy, and shadow again.

## Tests

`npm test` runs `supabase/functions/moderate-photo/moderate-photo.test.ts`
(threshold and verdict mapping, provider error and malformed response -> pending,
webhook secret 401, idempotency, daily cap, all three modes) and `npm run test:db`
covers the database side (`test_photo_moderation_auto.sql`).

**Manual end-to-end check** (needs the real provider; not run in CI): with
`MODERATION_MODE=shadow`, upload an ordinary portrait and check that
`photo_moderation_events` gets a `shadow` / `safe` row. To see a borderline
result without any explicit image, use Rekognition's documented sample inputs in
the AWS console ("Content moderation" demo) to learn which of *your own harmless
photos* score highest, and set thresholds just above them.

## Compliance follow-up (human)

- Add the provider as a **processor** to the data inventory: *Amazon Web Services
  EMEA SARL / Rekognition, eu-west-1 (Ireland): profile photos, processed to detect
  nudity, not stored by the provider for model training (opt out via the AWS AI
  services opt-out policy)*.
- Update the Privacy Policy to say photos are checked automatically and that a
  person may review them.
- Confirm the AWS DPA and apply the AI services opt-out policy for Rekognition.
