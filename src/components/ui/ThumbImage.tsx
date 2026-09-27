"use client";

import { useEffect, useRef, useState } from "react";
import { photoUrl, thumbUrl } from "@/lib/photos";

/**
 * Paths known to have no thumbnail (uploaded before thumbnails existed), so a
 * list of old photos costs one failed request per photo per session rather
 * than one per render.
 */
const missingThumbs = new Set<string>();

/**
 * Loads the small thumbnail of a stored photo, falling back to the full image
 * for photos uploaded before thumbnails were generated.
 */
export function ThumbImage({
  storagePath,
  alt,
  className,
  loading = "lazy",
}: {
  storagePath: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const useFull = failedPath === storagePath || missingThumbs.has(storagePath);
  const src = useFull ? photoUrl(storagePath) : thumbUrl(storagePath);

  const fallBack = () => {
    missingThumbs.add(storagePath);
    setFailedPath(storagePath);
  };

  // A server-rendered <img> can fail before React hydrates and attaches
  // onError, and that event is not replayed — so check once after mount too.
  useEffect(() => {
    const img = ref.current;
    if (!useFull && img?.complete && img.naturalWidth === 0) fallBack();
    // Only the initial, possibly pre-hydration, load needs this check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storagePath]);

  if (!src) return null;

  return (
    // Storage serves already-compressed WebP, so next/image would only add an
    // optimisation hop that costs money on Vercel's free tier.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      draggable={false}
      onError={() => {
        if (!useFull) fallBack();
      }}
    />
  );
}
