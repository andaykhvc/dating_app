# Moderation runbook

How a human moderator handles things that need a decision. Everything here works
from the Supabase SQL editor (and one small script) at launch; nothing needs a
paid tool.

## Profile photos

Every uploaded photo starts as **pending**. Other people see a photo only once it
is **approved**; a user with no approved photo is not shown in Discover (they can
still browse and chat). Photos that existed before moderation was introduced were
grandfathered as approved.

### 1. Look at what is waiting

```sql
select * from moderation_photo_queue;   -- oldest first
```

Open a photo at `<your project url>/storage/v1/object/public/profile-photos/<storage_path>`
(the view's `public_url_path` column is everything after the project URL).

Target: review within 24 hours. The app tells people "usually within a day".

### 2. Approve

```sql
select approve_photo('<photo_id>');
```

### 3. Reject

Run the script, which marks the photo rejected **and** deletes the file from storage
(deleting rows from `storage.objects` with SQL does not remove the file):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service role key> \
node scripts/moderation/reject-photo.mjs <photo_id> "Nudity or sexual content"
```

The reason is shown to the user next to the photo, so keep it short and neutral
("Nudity or sexual content", "Not a clear photo of you", "Contains someone else's
personal information"). The user sees the new status the next time they open the
app; there is no push or email for this.

If you only have the SQL editor, `select reject_photo('<photo_id>', '<reason>');`
returns the file path; then delete that file (and its `.thumb` sibling) in
Supabase → Storage → `profile-photos` by hand.

### Photos of a reported user

If a report shows a problem with someone's photo, find it and reject it the same way,
whatever its current status (approved photos can be rejected too):

```sql
select id as photo_id, storage_path, moderation_status
from profile_photos where user_id = '<reported user id>' order by position;
```

### Optional: review the grandfathered photos

Photos that were live before moderation was introduced:

```sql
select ph.id as photo_id, ph.user_id, ph.storage_path
from profile_photos ph
where ph.moderation_status = 'approved'
  and ph.moderation_source = 'manual'
  and ph.moderated_at = (select min(moderated_at) from profile_photos where moderation_source = 'manual');
```

(They all share the migration's timestamp.) Reject any that should not be there.

## Residual risks and follow-ups

- **The bucket is public.** A pending or rejected file can be opened by anyone who
  has its exact URL. File names are random (`<user id>/<uuid>.webp`) and URLs are
  only returned to the owner of a pending photo, so they are not guessable; rejected
  files are deleted. A photo someone shares by URL while pending is still reachable
  until it is rejected.
- **Follow-up: private bucket.** Serving photos through short-lived signed URLs
  would close that gap. Trade-off: a signed URL has to be generated for every photo
  in every Discover batch (extra requests and cost per swipe batch, no long-term
  CDN caching), so it is a separate piece of work.
- **Chat does not carry images** (`messages` is text only), so there is nothing
  to moderate there today. If images are ever added to chat, they need the same
  pending/approved flow.
- Automatic checks (issue #50) will call the same `approve_photo` / `reject_photo`
  functions with `moderation_source = 'auto'`.
