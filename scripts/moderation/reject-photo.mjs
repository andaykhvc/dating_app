// Rejects a profile photo and deletes its files from storage.
//
//   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service role key> \
//   node scripts/moderation/reject-photo.mjs <photo_id> "Nudity or sexual content"
//
// Why a script: reject_photo() (SQL) only marks the row. Deleting rows from
// storage.objects with SQL does not remove the stored file, so the files are
// removed here through the Storage API. The service-role key stays on your
// machine; it must never be committed or used in the browser.
import { createClient } from "@supabase/supabase-js";

const [photoId, ...reasonParts] = process.argv.slice(2);
const reason = reasonParts.join(" ").trim();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!photoId || !reason) {
  console.error('Usage: node scripts/moderation/reject-photo.mjs <photo_id> "<reason shown to the user>"');
  process.exit(2);
}
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}

const BUCKET = "profile-photos";
// Same convention as src/lib/photos.ts: the thumbnail sits next to the photo.
const thumbPath = (path) => path.replace(/(\.[a-z0-9]+)?$/i, ".thumb$1");

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: path, error } = await admin.rpc("reject_photo", {
  p_photo_id: photoId,
  p_reason: reason,
  p_source: "manual",
});
if (error) {
  console.error(`Could not reject: ${error.message}`);
  process.exit(1);
}

const { error: removeError } = await admin.storage.from(BUCKET).remove([path, thumbPath(path)]);
if (removeError) {
  console.error(`Photo ${photoId} is marked rejected, but deleting ${path} failed: ${removeError.message}`);
  console.error("Delete it by hand in Supabase -> Storage -> profile-photos.");
  process.exit(1);
}

console.log(`Rejected ${photoId} ("${reason}") and deleted ${path} (and its thumbnail).`);
