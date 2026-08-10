"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BackIcon } from "@/components/icons";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { MessageInput } from "@/features/chat/components/MessageInput";
import { CorrectionComposer } from "@/features/chat/components/CorrectionComposer";
import { ReportBlockMenu } from "@/features/chat/components/ReportBlockMenu";
import { MissionCard } from "@/features/games/components/MissionCard";
import { useMatchChannel } from "@/features/chat/hooks/useMatchChannel";
import {
  fetchMessage,
  fetchMessages,
  markDelivered,
  sendMessage,
  submitCorrection,
} from "@/features/chat/api";
import { formatDayDivider } from "@/lib/date";
import { MESSAGE_PAGE_SIZE } from "@/lib/constants";
import type {
  ChatMessage,
  MatchMission,
  MatchSummary,
  MessageCorrection,
} from "@/types/domain";

export function ChatThread({
  match,
  viewerId,
  initialMessages,
}: {
  match: MatchSummary;
  viewerId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [mission, setMission] = useState<MatchMission | null>(match.mission);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [correcting, setCorrecting] = useState<ChatMessage | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialMessages.length >= MESSAGE_PAGE_SIZE,
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const isActive = match.status === "active";

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom("instant");
  }, [scrollToBottom]);

  const onRealtimeMessage = useCallback(
    async (messageId: number) => {
      // The payload carries only the raw row; refetching picks up the embedded
      // reply and correction in the same shape the rest of the list uses.
      const message = await fetchMessage(messageId);
      if (!message) return;

      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );

      if (message.sender_id !== viewerId && message.delivery_state === "sent") {
        markDelivered(message.id);
      }
      scrollToBottom();
    },
    [viewerId, scrollToBottom],
  );

  const onRealtimeCorrection = useCallback((correction: MessageCorrection) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === correction.message_id ? { ...m, correction } : m,
      ),
    );
  }, []);

  useMatchChannel(match.match_id, {
    onMessage: onRealtimeMessage,
    onCorrection: onRealtimeCorrection,
  });

  // Anything already on screen when the thread opens counts as delivered.
  useEffect(() => {
    for (const message of initialMessages) {
      if (message.sender_id !== viewerId && message.delivery_state === "sent") {
        markDelivered(message.id);
      }
    }
  }, [initialMessages, viewerId]);

  async function loadOlder() {
    if (loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const older = await fetchMessages(match.match_id, messages[0].id);
      setHasMore(older.length >= MESSAGE_PAGE_SIZE);
      setMessages((prev) => [...older, ...prev]);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function handleSend(body: string) {
    const message = await sendMessage(
      match.match_id,
      viewerId,
      body,
      replyTo?.id ?? null,
    );
    setReplyTo(null);
    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message],
    );
    scrollToBottom();
  }

  async function handleCorrection(correctedText: string, note: string) {
    if (!correcting) return;
    const correction = await submitCorrection(
      correcting.id,
      viewerId,
      correctedText,
      note || null,
    );
    setMessages((prev) =>
      prev.map((m) =>
        m.id === correcting.id
          ? { ...m, correction: correction as MessageCorrection }
          : m,
      ),
    );
  }

  const rendered = messages.map((message, i) => {
    const day = formatDayDivider(message.created_at);
    const previous = messages[i - 1];
    return {
      message,
      day,
      showDivider:
        !previous || formatDayDivider(previous.created_at) !== day,
    };
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-top sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-2.5">
          <Link
            href="/messages"
            aria-label="Back to messages"
            className="rounded-full p-2 text-muted hover:bg-sunken"
          >
            <BackIcon className="size-5" />
          </Link>
          <Avatar
            storagePath={match.partner.primary_photo_path}
            name={match.partner.first_name}
            userId={match.partner.id}
            size={38}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">
              {match.partner.first_name}
            </p>
            <p className="truncate text-[0.6875rem] text-faint">
              {match.partner.languages
                .map((l) =>
                  l.role === "native"
                    ? `Speaks ${l.language_name}`
                    : `Learning ${l.language_name} ${l.cefr_level}`,
                )
                .join(" · ")}
            </p>
          </div>
          <ReportBlockMenu
            partnerId={match.partner.id}
            partnerName={match.partner.first_name}
            viewerId={viewerId}
            matchId={match.match_id}
          />
        </div>
      </header>

      {mission && isActive && (
        <MissionCard
          mission={mission}
          matchId={match.match_id}
          onCompleted={() => setMission(null)}
        />
      )}

      <div className="mx-auto w-full max-w-md flex-1 space-y-3 px-4 py-4">
        {hasMore && (
          <button
            type="button"
            onClick={loadOlder}
            disabled={loadingOlder}
            className="mx-auto block rounded-full bg-sunken px-4 py-1.5 text-xs font-semibold text-muted"
          >
            {loadingOlder ? "Loading…" : "Load earlier messages"}
          </button>
        )}

        {messages.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-muted">
              You matched with {match.partner.first_name}.
            </p>
            <p className="mt-1 text-sm text-faint">
              The mission above is a decent place to start.
            </p>
          </div>
        )}

        {rendered.map(({ message, day, showDivider }) => (
          <div key={message.id} className="space-y-3">
            {showDivider && (
              <p className="py-1 text-center text-[0.6875rem] font-medium text-faint">
                {day}
              </p>
            )}
            <MessageBubble
              message={message}
              isMine={message.sender_id === viewerId}
              onReply={() => setReplyTo(message)}
              onCorrect={() => setCorrecting(message)}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={handleSend}
        disabled={!isActive}
      />

      <CorrectionComposer
        message={correcting}
        onClose={() => setCorrecting(null)}
        onSubmit={handleCorrection}
      />
    </div>
  );
}
