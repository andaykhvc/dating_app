"use client";

import { useCallback, useRef, useState } from "react";
import { fetchDiscoveryBatch } from "@/features/discovery/api";
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

  const refill = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const batch = await fetchDiscoveryBatch();
      setCards((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...batch.filter((c) => !seen.has(c.id))];
      });
      setExhausted(batch.length === 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load more people.");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  const dismissTop = useCallback(() => {
    setCards((prev) => prev.slice(1));
  }, []);

  return { cards, loading, exhausted, error, dismissTop, refill };
}
