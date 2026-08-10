"use client";

import { useState } from "react";
import Link from "next/link";
import { SwipeDeck } from "@/features/discovery/components/SwipeDeck";
import { MatchCelebration } from "@/features/matching/components/MatchCelebration";
import { useDiscoveryFeed } from "@/features/discovery/hooks/useDiscoveryFeed";
import { recordSwipe } from "@/features/discovery/api";
import { DISCOVERY_REFILL_AT } from "@/lib/constants";
import type { DiscoveryCard, SwipeAction } from "@/types/domain";

export function DiscoveryScreen({ initial }: { initial: DiscoveryCard[] }) {
  const { cards, exhausted, error, dismissTop, refill } =
    useDiscoveryFeed(initial);
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<{
    matchId: string;
    partner: DiscoveryCard;
  } | null>(null);
  const [swipeError, setSwipeError] = useState<string | null>(null);

  async function handleSwipe(card: DiscoveryCard, action: SwipeAction) {
    setBusy(true);
    setSwipeError(null);
    // Advance the deck immediately — waiting on the network before showing the
    // next card is what makes a swipe feel sluggish.
    dismissTop();

    // Top up while there are still cards on screen, so swiping never stalls.
    if (cards.length - 1 <= DISCOVERY_REFILL_AT) refill();

    try {
      const result = await recordSwipe(card.id, action);
      if (result.matched && result.match_id) {
        setMatch({ matchId: result.match_id, partner: card });
      }
    } catch (e) {
      setSwipeError(
        e instanceof Error ? e.message : "That swipe did not go through.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-2xl">
          🗺️
        </div>
        <h2 className="mt-5 text-xl font-bold text-ink">
          {exhausted ? "That is everyone for now" : "Looking for people…"}
        </h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          {exhausted
            ? "Widening your age range or countries in Settings brings more people in. New members appear here as they join."
            : "One moment."}
        </p>
        {exhausted && (
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={refill}
              className="rounded-full border border-line bg-raised px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Check again
            </button>
            <Link
              href="/profile/edit"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-brand"
            >
              Adjust who I meet
            </Link>
          </div>
        )}
        {error && <p className="mt-4 text-xs text-negative">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-3">
        <SwipeDeck cards={cards} onSwipe={handleSwipe} busy={busy} />
        {swipeError && (
          <p role="alert" className="pb-2 text-center text-xs text-negative">
            {swipeError}
          </p>
        )}
      </div>

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
