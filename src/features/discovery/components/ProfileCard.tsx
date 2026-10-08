import { memo } from "react";
import { Chip } from "@/components/ui/Chip";
import { InfoIcon } from "@/components/icons";
import { photoUrl } from "@/lib/photos";
import { COUNTRY_BY_CODE, INTENTION_LABELS } from "@/lib/constants";
import type { DiscoveryCard } from "@/types/domain";

/**
 * The card is a photo with an information panel welded to the bottom rather
 * than text floating over an image — languages and level are the point of this
 * product, so they get solid contrast instead of a gradient scrim.
 *
 * It is a size container: what the panel shows is decided by the height the
 * deck actually gives the card, not by guessing from the viewport. On a short
 * phone the bio and interests step aside so the photo keeps its share; in a
 * landscape slot the panel moves beside the photo, where height is not the
 * constraint any more, so they come back. On desktop the panel beside the deck
 * shows them, so the card leaves them out and gives the photo the room.
 * Everything hidden here is in the details view behind the info button.
 */
export const ProfileCard = memo(function ProfileCard({
  card,
  eager,
  onInfo,
}: {
  card: DiscoveryCard;
  eager?: boolean;
  onInfo?: () => void;
}) {
  const url = photoUrl(card.primary_photo_path);
  const country = COUNTRY_BY_CODE.get(card.country_code);
  const native = card.languages.find((l) => l.role === "native");
  const learning = card.languages.find((l) => l.role === "learning");

  return (
    <article className="card-container size-full overflow-hidden rounded-[var(--radius-card)] bg-raised shadow-[0_0_0_0.5px_var(--separator),0_24px_60px_-24px_rgb(0_0_0/0.5)]">
      <div className="flex size-full flex-col card-wide:flex-row">
        <div className="relative min-h-[42%] flex-1 overflow-hidden bg-sunken card-wide:min-h-0 card-wide:max-w-[46%]">
          {/* Placeholder underneath, so the slot never collapses or jumps. */}
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-faint"
          >
            {card.first_name.charAt(0)}
          </div>
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={`${card.first_name}'s photo`}
              className="absolute inset-0 size-full object-cover"
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : "auto"}
              decoding="async"
              draggable={false}
            />
          )}

          {learning && (
            <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white shadow-[inset_0_0.5px_0_rgb(255_255_255/0.3)] backdrop-blur-xl backdrop-saturate-150">
              <span>{learning.flag_emoji}</span>
              <span className="truncate">Learning {learning.language_name}</span>
              <span className="shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-bold">
                {learning.cefr_level}
              </span>
            </div>
          )}
        </div>

        <div className="flex min-h-0 shrink-0 flex-col gap-3 overflow-hidden p-5 card-compact:gap-2 card-compact:px-4 card-compact:py-3.5 card-wide:flex-1 card-wide:shrink">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-[1.75rem] font-bold leading-tight tracking-[-0.024em] text-ink [overflow-wrap:anywhere] card-compact:text-2xl card-tiny:text-xl">
                {card.first_name}, {card.age}
              </h2>
              <p className="mt-0.5 truncate text-sm text-muted">
                {[card.city, country?.name].filter(Boolean).join(", ")}{" "}
                {country?.flag}
              </p>
            </div>
            {onInfo && (
              <button
                type="button"
                // Starting a drag from the button would swallow the tap.
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onInfo}
                aria-label={`More about ${card.first_name}`}
                className="press -mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-fill hover:text-ink"
              >
                <InfoIcon className="size-6" />
              </button>
            )}
          </div>

          {native && (
            <p className="truncate text-sm text-ink">
              <span className="text-muted">Speaks</span>{" "}
              <span className="font-semibold">
                {native.flag_emoji} {native.language_name}
              </span>
            </p>
          )}

          {card.interests.length > 0 && (
            <p className="line-clamp-1 text-sm text-muted card-compact:hidden card-wide:[display:-webkit-box] lg:hidden">
              {card.interests.map((i) => i.label).join(" · ")}
            </p>
          )}

          {card.intentions.length > 0 && (
            <div className="flex max-h-[3.75rem] flex-wrap gap-1.5 overflow-hidden card-tiny:hidden card-wide:flex lg:hidden">
              {card.intentions.map((intention) => (
                <Chip
                  key={intention}
                  tone={intention === "open_to_dating" ? "accent" : "brand"}
                >
                  {INTENTION_LABELS[intention]}
                </Chip>
              ))}
            </div>
          )}

          {card.bio && (
            <p className="line-clamp-2 text-sm italic leading-relaxed text-muted [overflow-wrap:anywhere] card-compact:hidden card-wide:[display:-webkit-box] lg:hidden">
              “{card.bio}”
            </p>
          )}
        </div>
      </div>
    </article>
  );
});
