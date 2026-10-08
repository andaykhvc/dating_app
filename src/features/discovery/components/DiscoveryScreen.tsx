"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  SwipeDeck,
  type SwipeDeckHandle,
} from "@/features/discovery/components/SwipeDeck";
import { ProfileDetails } from "@/features/discovery/components/ProfileDetails";
import { MatchCelebration } from "@/features/matching/components/MatchCelebration";
import { useDiscoveryFeed } from "@/features/discovery/hooks/useDiscoveryFeed";
import { fetchProfileCard, recordSwipe } from "@/features/discovery/api";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { photoUrl } from "@/lib/photos";
import { DISCOVERY_REFILL_AT } from "@/lib/constants";
import type {
  DiscoveryCard,
  ProfileCard,
  SwipeAction,
} from "@/types/domain";

/** Photos further down the deck are warmed up so a fast swiper never waits. */
const PRELOAD_AHEAD = 3;

export function DiscoveryScreen({ initial }: { initial: DiscoveryCard[] }) {
  const { cards, exhausted, error, dismissTop, undismiss, refill } =
    useDiscoveryFeed(initial);
  const deckRef = useRef<SwipeDeckHandle>(null);
  const [match, setMatch] = useState<{
    matchId: string;
    partner: DiscoveryCard;
  } | null>(null);
  const [swipeError, setSwipeError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [fullCards, setFullCards] = useState<Record<string, ProfileCard>>({});
  const preloaded = useRef(new Set<string>());
  const top = cards[0];

  const handleSwipe = useCallback(
    async (card: DiscoveryCard, action: SwipeAction) => {
      setSwipeError(null);
      // Advance the deck immediately and never hold the next swipe on the
      // network — waiting for a round trip is what makes swiping feel sluggish.
      dismissTop();

      // Top up while there are still cards on screen, so swiping never stalls.
      if (cards.length - 1 <= DISCOVERY_REFILL_AT) refill();

      try {
        const result = await recordSwipe(card.id, action);
        if (result.matched && result.match_id) {
          setMatch({ matchId: result.match_id, partner: card });
        }
      } catch (e) {
        undismiss(card.id);
        setSwipeError(
          e instanceof Error ? e.message : "That swipe did not go through.",
        );
      }
    },
    [cards.length, dismissTop, undismiss, refill],
  );

  const openDetails = useCallback(async () => {
    if (!top) return;
    setDetailsOpen(true);
    if (fullCards[top.id]) return;
    try {
      const full = await fetchProfileCard(top.id);
      if (full) setFullCards((prev) => ({ ...prev, [full.id]: full }));
    } catch {
      // The sheet already shows everything from the card; the gallery is extra.
    }
  }, [top, fullCards]);

  useEffect(() => {
    for (const card of cards.slice(2, 2 + PRELOAD_AHEAD)) {
      const url = photoUrl(card.primary_photo_path);
      if (!url || preloaded.current.has(url)) continue;
      preloaded.current.add(url);
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    }
  }, [cards]);

  // Arrow keys on a keyboard: the desktop equivalent of a thumb.
  useEffect(() => {
    if (!top || detailsOpen || match) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight") deckRef.current?.swipe("like");
      else if (e.key === "ArrowLeft") deckRef.current?.swipe("pass");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [top, detailsOpen, match]);

  if (!top) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-2xl">
          🗺️
        </div>
        <h2 className="mt-5 text-xl font-bold text-ink">
          {exhausted ? "That is everyone for now" : "Looking for people…"}
        </h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          {exhausted
            ? "Widening your age range or countries brings more people in. New members appear here as they join."
            : "One moment."}
        </p>
        {exhausted && (
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
            <Button variant="secondary" onClick={refill}>
              Check again
            </Button>
            <Link
              href="/profile/edit"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand-soft"
            >
              Adjust who I meet
            </Link>
          </div>
        )}
        {error && <p className="mt-4 text-xs text-negative">{error}</p>}
      </div>
    );
  }

  const full = fullCards[top.id] ?? null;

  return (
    <>
      <div className="flex min-h-0 flex-1 justify-center gap-10 px-gutter pb-3 pt-3 md:pb-6 md:pt-5 xl:gap-16">
        {/* Stretches to the available height; the inner column caps it so a
            tall monitor gets a well-proportioned card, centred, not a strip. */}
        <div className="flex w-full min-w-0 max-w-[26rem] flex-col tiny:max-w-2xl">
          <div className="my-auto flex min-h-0 w-full flex-1 flex-col md:max-h-[46rem]">
            <SwipeDeck
              ref={deckRef}
              cards={cards}
              onSwipe={handleSwipe}
              onInfo={openDetails}
              busy={match !== null}
            />
            {swipeError && (
              <p role="alert" className="pt-2 text-center text-xs text-negative">
                {swipeError}
              </p>
            )}
          </div>
        </div>

        {/* Desktop: what a phone keeps behind the info button sits beside the
            card, and follows it as the deck moves. Absolutely positioned so a
            long bio scrolls inside the panel instead of stretching the row
            (which pushed the deck's buttons below the fold on short screens). */}
        <aside className="relative hidden w-[21rem] shrink-0 lg:block xl:w-[23rem]">
          <div className="absolute inset-0 flex flex-col">
            <div className="my-auto max-h-[min(100%,46rem)] overflow-y-auto overscroll-contain rounded-[var(--radius-card)] border border-line bg-raised p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                Up now
              </p>
              <h2 className="mb-5 mt-1 text-2xl font-bold tracking-tight text-ink [overflow-wrap:anywhere]">
                {top.first_name}, {top.age}
              </h2>
              <ProfileDetails card={top} />
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={openDetails}
                  className="rounded-full text-sm font-semibold text-brand hover:underline"
                >
                  See all photos
                </button>
                <p className="text-xs text-faint">
                  <Kbd>←</Kbd> pass · <Kbd>→</Kbd> like
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Sheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={`${top.first_name}, ${top.age}`}
        size="lg"
      >
        <ProfileDetails card={top} full={full} />
      </Sheet>

      {match && (
        <MatchCelebration
          matchId={match.matchId}
          partner={match.partner}
          onDismiss={() => setMatch(null)}
        />
      )}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded-md border border-line bg-sunken px-1 font-sans text-xs text-muted">
      {children}
    </kbd>
  );
}
