"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MatchSummary } from "@/types/domain";

type LastMessage = NonNullable<MatchSummary["last_message"]>;

type ConversationsValue = {
  /** The freshest match list any page under /messages has fetched. */
  snapshot: MatchSummary[] | null;
  sync: (matches: MatchSummary[]) => void;
  /** Newer-than-server last messages, keyed by match id. */
  latest: Record<string, LastMessage>;
  touch: (matchId: string, message: LastMessage) => void;
};

const ConversationsContext = createContext<ConversationsValue | null>(null);

/**
 * Keeps the docked desktop conversation list current without a second
 * Realtime channel or an extra query.
 *
 * The layout that renders the sidebar is not re-rendered when you move between
 * threads, so on its own the list would be frozen at first load. But every
 * page under /messages already fetches the match list (the thread page needs it
 * to find its match), so each one hands it over here; and the open thread
 * reports messages it sends or receives in between.
 */
export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<MatchSummary[] | null>(null);
  const [latest, setLatest] = useState<Record<string, LastMessage>>({});

  const touch = useCallback((matchId: string, message: LastMessage) => {
    setLatest((prev) =>
      prev[matchId] && prev[matchId].id >= message.id
        ? prev
        : { ...prev, [matchId]: message },
    );
  }, []);

  const value = useMemo(
    () => ({ snapshot, sync: setSnapshot, latest, touch }),
    [snapshot, latest, touch],
  );
  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  return useContext(ConversationsContext);
}

/** Rendered by a page to hand the match list it fetched to the sidebar. */
export function SyncConversations({ matches }: { matches: MatchSummary[] }) {
  const sync = useConversations()?.sync;
  useEffect(() => {
    sync?.(matches);
  }, [sync, matches]);
  return null;
}

/**
 * The list with locally seen messages folded in, newest conversation first.
 * `followSnapshot` is for the docked sidebar, whose own `matches` date from
 * first load: it prefers the latest list a page has handed over.
 */
export function useLiveMatches(
  matches: MatchSummary[],
  { followSnapshot = false } = {},
): MatchSummary[] {
  const context = useConversations();
  const base = (followSnapshot && context?.snapshot) || matches;
  const latest = context?.latest;

  return useMemo(() => {
    if (!latest || Object.keys(latest).length === 0) return base;
    const at = (m: MatchSummary) =>
      Date.parse(m.last_message?.created_at ?? m.matched_at);
    return base
      .map((m) => {
        const local = latest[m.match_id];
        return local && (!m.last_message || local.id > m.last_message.id)
          ? { ...m, last_message: local }
          : m;
      })
      .sort((a, b) => at(b) - at(a));
  }, [base, latest]);
}
