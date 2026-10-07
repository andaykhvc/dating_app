"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDiscoveryBatch } from "@/features/discovery/api";
import { freshCards } from "@/features/discovery/feed";
import type { DiscoveryCard } from "@/types/domain";

/**
 * Holds the deck.
 *
 * There is no page offset: every swipe is written to the database before the
 * next card is needed, so already-swiped people simply stop coming back.
 * Refilling is driven by the swipe handler rather than an effect watching the
 * length, which keeps the fetch on the interaction that caused it.
 */
export function useDiscoveryFeed(initial: DiscoveryCard[]) {
  const [cards, setCards] = useState<DiscoveryCard[]>(initial);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initial.length === 0);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  // A refill can land before the swipe that removed someone has been written,
  // in which case the server still returns them. Remember who has gone.
  const dismissed = useRef(new Set<string>());
  const current = useRef(cards);
  useEffect(() => {
    current.current = cards;
  }, [cards]);

  const refill = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const batch = await fetchDiscoveryBatch();
      const fresh = freshCards(current.current, batch, dismissed.current);
      setCards((prev) => [...prev, ...freshCards(prev, batch, dismissed.current)]);
      // "Nothing new" is what exhausted means. Counting the raw batch instead
      // left the screen on "Looking for people…" for good whenever the server
      // returned only the card that had just been swiped.
      setExhausted(fresh.length === 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load more people.");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  const dismissTop = useCallback(() => {
    setCards((prev) => {
      if (prev[0]) dismissed.current.add(prev[0].id);
      return prev.slice(1);
    });
  }, []);

  /** The swipe never reached the server, so let a later refill bring them back. */
  const undismiss = useCallback((id: string) => {
    dismissed.current.delete(id);
  }, []);

  return { cards, loading, exhausted, error, dismissTop, undismiss, refill };
}
