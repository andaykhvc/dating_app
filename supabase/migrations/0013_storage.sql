-- 0013_storage.sql
-- Profile photo storage.
--
-- The bucket is public on purpose. A discovery batch renders a dozen photos at
-- once; minting a signed URL for each would mean a dozen extra round trips per
-- swipe session on a free tier. Object keys are "<user-uuid>/<random-uuid>",
-- which is unguessable, and the only thing "public" grants is reading a photo
-- the user already chose to put on a profile card.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  2097152, -- 2 MB; the client compresses to well under this before upload
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Profile photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

-- Writes are confined to a folder named after the uploader's own user id.
create policy "Users upload their own profile photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update their own profile photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete their own profile photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
