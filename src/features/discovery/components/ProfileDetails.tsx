import { Chip } from "@/components/ui/Chip";
import { SectionLabel } from "@/components/layout/Page";
import { photoUrl } from "@/lib/photos";
import {
  CEFR_DESCRIPTIONS,
  COUNTRY_BY_CODE,
  INTENTION_LABELS,
} from "@/lib/constants";
import type { DiscoveryCard, ProfileCard } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Everything about a person the card has no room for. Rendered as a side
 * panel next to the deck on desktop and inside a sheet on phones; `full` adds
 * the gallery and the complete interest list once it has been fetched.
 */
export function ProfileDetails({
  card,
  full,
  className,
}: {
  card: DiscoveryCard;
  full?: ProfileCard | null;
  className?: string;
}) {
  const country = COUNTRY_BY_CODE.get(card.country_code);
  const native = card.languages.find((l) => l.role === "native");
  const learning = card.languages.find((l) => l.role === "learning");
  const interests = full?.interests ?? card.interests;
  const photos = full?.photos ?? [];

  return (
    <div className={cn("space-y-6", className)}>
      {photos.length > 0 && (
        // Swipeable strip on phones; a peek of the next photo says "scroll me".
        <ul className="scrollbar-none -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-2 overflow-x-auto px-5 sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {photos.map((photo, i) => {
            const url = photoUrl(photo.storage_path);
            return (
              <li
                key={photo.id}
                className="aspect-[3/4] w-[70%] shrink-0 snap-start overflow-hidden rounded-2xl bg-sunken sm:w-[46%]"
              >
                {url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={`${card.first_name}, photo ${i + 1}`}
                    className="size-full object-cover"
                    loading={i < 2 ? "eager" : "lazy"}
                    decoding="async"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {card.bio && (
        <section>
          <SectionLabel>About</SectionLabel>
          <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink [overflow-wrap:anywhere]">
            {card.bio}
          </p>
        </section>
      )}

      <section>
        <SectionLabel>Languages</SectionLabel>
        <ul className="space-y-2">
          {native && (
            <li className="flex items-center gap-3 rounded-2xl bg-sunken px-4 py-3">
              <span className="text-xl leading-none">{native.flag_emoji}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                {native.language_name}
              </span>
              <Chip>Native</Chip>
            </li>
          )}
          {learning && (
            <li className="flex items-center gap-3 rounded-2xl bg-brand-soft/60 px-4 py-3">
              <span className="text-xl leading-none">{learning.flag_emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  Learning {learning.language_name}
                </span>
                {learning.cefr_level && (
                  <span className="block truncate text-xs text-muted">
                    {CEFR_DESCRIPTIONS[learning.cefr_level]}
                  </span>
                )}
              </span>
              {learning.cefr_level && <Chip tone="brand">{learning.cefr_level}</Chip>}
            </li>
          )}
        </ul>
      </section>

      {interests.length > 0 && (
        <section>
          <SectionLabel>Interests</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((interest) => (
              <Chip key={interest.key}>
                {interest.emoji} {interest.label}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {card.intentions.length > 0 && (
        <section>
          <SectionLabel>Here for</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {card.intentions.map((intention) => (
              <Chip
                key={intention}
                tone={intention === "open_to_dating" ? "accent" : "brand"}
              >
                {INTENTION_LABELS[intention]}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {(card.city || country) && (
        <p className="text-sm text-muted">
          {country?.flag} {[card.city, country?.name].filter(Boolean).join(", ")}
        </p>
      )}
    </div>
  );
}
