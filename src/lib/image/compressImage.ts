import {
  MAX_PHOTO_DIMENSION,
  PHOTO_QUALITY,
  THUMB_DIMENSION,
  THUMB_QUALITY,
} from "@/lib/constants";

/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * A modern phone photo is 3-8 MB; downscaling to 1280px WebP puts it under
 * ~150 KB. On a free Storage tier that is the difference between a few hundred
 * users and a few thousand, and it costs one canvas draw and no dependency.
 */
export async function compressImage(file: File): Promise<{
  full: Blob;
  thumb: Blob;
}> {
  const bitmap = await createImageBitmap(file);
  try {
    // The thumbnail is what avatars and lists load, so a chat list of twenty
    // people costs ~200 KB instead of several megabytes of full-size photos.
    const [full, thumb] = await Promise.all([
      encode(bitmap, MAX_PHOTO_DIMENSION, PHOTO_QUALITY),
      encode(bitmap, THUMB_DIMENSION, THUMB_QUALITY),
    ]);
    return { full, thumb };
  } finally {
    bitmap.close();
  }
}

async function encode(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number,
): Promise<Blob> {
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process this image.");

  ctx.drawImage(bitmap, 0, 0, width, height);

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  // A browser that cannot encode WebP (some Safari versions cannot) silently returns a PNG
  // instead, which for a 1280px photo is several megabytes and over the
  // bucket's 2 MB limit. JPEG at the same quality stays small.
  let blob = await toBlob("image/webp");
  if (blob && blob.type !== "image/webp") blob = await toBlob("image/jpeg");

  if (!blob) throw new Error("Could not process this image.");
  return blob;
}
