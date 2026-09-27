import { ThumbImage } from "@/components/ui/ThumbImage";
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
  const initial = name?.trim().charAt(0).toUpperCase() ?? "?";

  // The initial sits underneath the photo, so there is a stable placeholder of
  // the final size while the image loads and no layout shift when it arrives.
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      style={{ width: size, height: size, background: initialTone(userId) }}
    >
      <span
        aria-hidden={storagePath ? true : undefined}
        className="font-semibold text-white"
        style={{ fontSize: size * 0.4 }}
      >
        {initial}
      </span>
      {storagePath && (
        <ThumbImage
          storagePath={storagePath}
          alt={name ?? "Profile photo"}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </span>
  );
}
