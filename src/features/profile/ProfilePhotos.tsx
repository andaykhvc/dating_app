import { ThumbImage } from "@/components/ui/ThumbImage";
import { photoUrl } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * Your own gallery. A swipeable strip of small tiles on phones and tablets; on
 * desktop the main photo leads at full width with the rest tiled underneath.
 * Tiles use thumbnails; only the desktop lead photo loads full size.
 */
export function ProfilePhotos({
  photos,
  name,
}: {
  photos: { id: string; storage_path: string }[];
  name: string;
}) {
  const mainUrl = photoUrl(photos[0].storage_path);
  const tile = "aspect-[3/4] w-28 shrink-0 snap-start overflow-hidden rounded-2xl bg-sunken sm:w-32";

  return (
    <div>
      {mainUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mainUrl}
          alt={`${name}, main photo`}
          className="hidden aspect-[4/5] w-full rounded-[var(--radius-card)] bg-sunken object-cover lg:block"
          decoding="async"
        />
      )}

      {photos.length > 1 && (
        <ul className="scrollbar-none -mx-gutter flex snap-x scroll-px-[var(--gutter)] gap-2 overflow-x-auto px-gutter lg:mx-0 lg:mt-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {photos.map((photo, i) => (
            // The lead photo is already shown large on desktop.
            <li key={photo.id} className={cn(tile, i === 0 ? "lg:hidden" : "lg:w-auto")}>
              <ThumbImage
                storagePath={photo.storage_path}
                alt={`${name}, photo ${i + 1}`}
                className="size-full object-cover"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
