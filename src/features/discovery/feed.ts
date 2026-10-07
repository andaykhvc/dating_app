import type { DiscoveryCard } from "@/types/domain";

/**
 * The cards in `batch` that the deck should actually gain: not already in it,
 * and not someone the user has just swiped away.
 *
 * A refill can reach the database before the swipe that removed the last card
 * has been written, so the server may hand back people who are already gone.
 */
export function freshCards(
  current: readonly DiscoveryCard[],
  batch: readonly DiscoveryCard[],
  dismissed: ReadonlySet<string>,
): DiscoveryCard[] {
  const seen = new Set(current.map((c) => c.id));
  return batch.filter((c) => !seen.has(c.id) && !dismissed.has(c.id));
}
