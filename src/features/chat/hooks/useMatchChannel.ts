"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageCorrection } from "@/types/domain";

/**
 * One Realtime channel, open only while a thread is on screen.
 *
 * The matches and messages lists deliberately hold no subscriptions: one live
 * channel per open conversation is a very different number from one per
 * conversation you have ever had, and the free tier counts them.
 *
 * Postgres Changes rather than Broadcast, because the insert is already the
 * source of truth and RLS filters the stream for free — a subscriber cannot
 * receive a row they would not be allowed to select.
 */
export function useMatchChannel(
  matchId: string,
  handlers: {
    onMessage: (messageId: number) => void;
    onCorrection: (correction: MessageCorrection) => void;
  },
) {
  const { onMessage, onCorrection } = handlers;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => onMessage((payload.new as { id: number }).id),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_corrections" },
        (payload) => onCorrection(payload.new as MessageCorrection),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, onMessage, onCorrection]);
}
