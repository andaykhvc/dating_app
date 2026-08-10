import { photoUrl } from "@/lib/photos";
import { cn } from "@/lib/utils";

/** Deterministic hue from the user id, so the fallback is stable per person. */
function initialTone(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(hash) % 360} 62% 58%)`;
}

export function Avatar({
  storagePath,
  name,
  userId,
  size = 48,
  className,
}: {
  storagePath: string | null;
  name: string | null;
  userId: string;
  size?: number;
  className?: string;
}) {
  const url = photoUrl(storagePath);
  const initial = name?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {url ? (
        // Storage serves already-compressed WebP, so next/image would only add
        // an optimisation hop that costs money on Vercel's free tier.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name ?? "Profile photo"}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <span
          className="flex size-full items-center justify-center font-semibold text-white"
          style={{
            background: initialTone(userId),
            fontSize: size * 0.4,
          }}
        >
          {initial}
        </span>
      )}
    </span>
  );
}
