import { MAX_PHOTO_DIMENSION, PHOTO_QUALITY } from "@/lib/constants";

/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * A modern phone photo is 3-8 MB; downscaling to 1280px WebP puts it under
 * ~150 KB. On a free Storage tier that is the difference between a few hundred
 * users and a few thousand, and it costs one canvas draw and no dependency.
 */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(
    1,
    MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process this image.");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", PHOTO_QUALITY),
  );

  if (!blob) throw new Error("Could not process this image.");
  return blob;
}
