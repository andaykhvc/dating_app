import { Chip } from "@/components/ui/Chip";
import { photoUrl } from "@/lib/photos";
import { COUNTRY_BY_CODE, INTENTION_LABELS } from "@/lib/constants";
import type { DiscoveryCard } from "@/types/domain";

/**
 * The card is a photo with an information panel welded to the bottom rather
 * than text floating over an image — languages and level are the point of this
 * product, so they get solid contrast instead of a gradient scrim.
 */
export function ProfileCard({
  card,
  eager,
}: {
  card: DiscoveryCard;
  eager?: boolean;
}) {
  const url = photoUrl(card.primary_photo_path);
  const country = COUNTRY_BY_CODE.get(card.country_code);
  const native = card.languages.find((l) => l.role === "native");
  const learning = card.languages.find((l) => l.role === "learning");

  return (
    <article className="flex size-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-raised shadow-[0_18px_50px_-20px_rgba(0,0,0,0.45)] ring-1 ring-line">
      <div className="relative min-h-0 flex-1 bg-sunken">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={`${card.first_name}'s photo`}
            className="size-full object-cover"
            loading={eager ? "eager" : "lazy"}
            draggable={false}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-6xl font-bold text-faint">
            {card.first_name.charAt(0)}
          </div>
        )}

        {learning && (
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <span>{learning.flag_emoji}</span>
            <span>Learning {learning.language_name}</span>
            <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[0.625rem]">
              {learning.cefr_level}
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 p-5">
        <div>
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-ink">
            {card.first_name}, {card.age}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {[card.city, country?.name].filter(Boolean).join(", ")}{" "}
            {country?.flag}
          </p>
        </div>

        {native && (
          <p className="text-sm text-ink">
            <span className="text-muted">Speaks</span>{" "}
            <span className="font-semibold">
              {native.flag_emoji} {native.language_name}
            </span>
          </p>
        )}

        {card.interests.length > 0 && (
          <p className="text-sm text-muted">
            {card.interests.map((i) => i.label).join(" · ")}
          </p>
        )}

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

        {card.bio && (
          <p className="line-clamp-2 text-sm italic leading-relaxed text-muted">
            “{card.bio}”
          </p>
        )}
      </div>
    </article>
  );
}
