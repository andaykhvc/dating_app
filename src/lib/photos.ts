const BUCKET = "profile-photos";

/**
 * Public bucket, so a photo URL is pure string concatenation — no signing
 * round trip per card in the discovery feed.
 */
export function photoUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

/**
 * Every upload stores a small sibling next to the full photo, found by naming
 * convention so no column or migration is needed. Photos uploaded before
 * thumbnails existed have no sibling; callers fall back to the full photo.
 */
export function thumbPath(storagePath: string): string {
  return storagePath.replace(/(\.[a-z0-9]+)?$/i, ".thumb$1");
}

export function thumbUrl(storagePath: string | null | undefined): string | null {
  return storagePath ? photoUrl(thumbPath(storagePath)) : null;
}

/** Columns to select wherever a photo is loaded for its owner (see StoredPhoto). */
export const STORED_PHOTO_COLUMNS =
  "id, storage_path, position, moderation_status, moderation_reason";

export { BUCKET as PHOTO_BUCKET };
