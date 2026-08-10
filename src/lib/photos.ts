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

export { BUCKET as PHOTO_BUCKET };
