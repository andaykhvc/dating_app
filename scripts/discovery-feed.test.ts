import { test } from "node:test";
import assert from "node:assert/strict";
import { freshCards } from "../src/features/discovery/feed.ts";
import type { DiscoveryCard } from "../src/types/domain.ts";

const card = (id: string) => ({ id }) as DiscoveryCard;

test("adds people the deck has not seen", () => {
  const fresh = freshCards([card("a")], [card("a"), card("b"), card("c")], new Set());
  assert.deepEqual(fresh.map((c) => c.id), ["b", "c"]);
});

test("never brings back someone who was just swiped away", () => {
  const fresh = freshCards([], [card("a"), card("b")], new Set(["a"]));
  assert.deepEqual(fresh.map((c) => c.id), ["b"]);
});

test("a batch of only swiped-away people adds nothing, which is what 'exhausted' means", () => {
  // The last card was swiped and the refill raced ahead of the swipe write,
  // so the server returned that same card. The deck must read as exhausted
  // rather than as "still loading".
  const fresh = freshCards([], [card("last")], new Set(["last"]));
  assert.equal(fresh.length, 0);
});
