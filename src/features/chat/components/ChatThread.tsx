"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { LocalTime, useHydrated } from "@/components/ui/LocalTime";
import { ArrowDownIcon, BackIcon } from "@/components/icons";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { MessageInput } from "@/features/chat/components/MessageInput";
import { CorrectionComposer } from "@/features/chat/components/CorrectionComposer";
import { ReportBlockMenu } from "@/features/chat/components/ReportBlockMenu";
import { MissionCard } from "@/features/games/components/MissionCard";
import { useMatchChannel } from "@/features/chat/hooks/useMatchChannel";
import { useVisualViewportHeight } from "@/features/chat/hooks/useVisualViewportHeight";
import { useConversations } from "@/features/chat/ConversationsContext";
import {
  fetchMessage,
  fetchMessages,
  markDelivered,
  sendMessage,
  submitCorrection,
} from "@/features/chat/api";
import { MESSAGE_PAGE_SIZE } from "@/lib/constants";
import type {
  ChatMessage,
  MatchMission,
  MatchSummary,
  MessageCorrection,
} from "@/types/domain";

/** How close to the bottom still counts as "reading the latest". */
const STICKY_BOTTOM_PX = 80;

/**
 * A full-height pane: header and composer fixed, messages scrolling between
 * them. That is what lets it sit next to the conversation list on desktop, and
 * — sized to the visual viewport — stay whole when a phone keyboard opens.
 */
export function ChatThread({
  match,
  viewerId,
  initialMessages,
  initialDraft = null,
}: {
  match: MatchSummary;
  viewerId: string;
  initialMessages: ChatMessage[];
  /** A phrase brought over from a lesson; lands in the composer, unsent. */
  initialDraft?: { text: string; languageCode: string } | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [mission, setMission] = useState<MatchMission | null>(match.mission);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [correcting, setCorrecting] = useState<ChatMessage | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialMessages.length >= MESSAGE_PAGE_SIZE,
  );
  const [unseen, setUnseen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const prepending = useRef<{ height: number; top: number } | null>(null);
  const revealSent = useRef(false);
  const touch = useConversations()?.touch;
  const hydrated = useHydrated();
  const isActive = match.status === "active";

  useVisualViewportHeight(rootRef);

  // The ?phrase= link has done its job once the draft is in the composer; a
  // refresh or a back-navigation should not put it there again.
  useEffect(() => {
    if (initialDraft) window.history.replaceState(null, "", `/messages/${match.match_id}`);
  }, [initialDraft, match.match_id]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollerRef.current;
    if (!el) return;
    atBottom.current = true;
    setUnseen(false);
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Open at the latest message, before the first paint.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Whatever changes size — the keyboard, the reply bar, a growing composer,
  // a new message — someone reading the latest message stays at the latest.
  useEffect(() => {
    const el = scrollerRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const observer = new ResizeObserver(() => {
      if (atBottom.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Older messages go on top without moving what is on screen.
    const saved = prepending.current;
    if (saved) {
      el.scrollTop = saved.top + (el.scrollHeight - saved.height);
      prepending.current = null;
    }
    // Your own message is always brought into view — scrolled to only now it
    // is in the DOM, so the animation aims at the real bottom, not the old one.
    if (revealSent.current) {
      revealSent.current = false;
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    atBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < STICKY_BOTTOM_PX;
    if (atBottom.current && unseen) setUnseen(false);
  }

  const onRealtimeMessage = useCallback(
    async (messageId: number) => {
      // The payload carries only the raw row; refetching picks up the embedded
      // reply and correction in the same shape the rest of the list uses.
      const message = await fetchMessage(messageId);
      if (!message) return;

      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
      touch?.(match.match_id, {
        id: message.id,
        body: message.body,
        created_at: message.created_at,
        is_mine: message.sender_id === viewerId,
      });

      if (message.sender_id !== viewerId && message.delivery_state === "sent") {
        markDelivered([message.id]);
      }
      // Someone scrolled back through history is not yanked to the bottom.
      // (Your own message echoing back from Realtime is not news.)
      if (!atBottom.current && message.sender_id !== viewerId) setUnseen(true);
    },
    [viewerId, match.match_id, touch],
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
    markDelivered(
      initialMessages
        .filter((m) => m.sender_id !== viewerId && m.delivery_state === "sent")
        .map((m) => m.id),
    );
  }, [initialMessages, viewerId]);

  async function loadOlder() {
    const el = scrollerRef.current;
    if (loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const older = await fetchMessages(match.match_id, messages[0].id);
      setHasMore(older.length >= MESSAGE_PAGE_SIZE);
      if (el) prepending.current = { height: el.scrollHeight, top: el.scrollTop };
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
    revealSent.current = true;
    // If Realtime delivered it first, still commit a new array so the reveal
    // effect above runs.
    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? [...prev] : [...prev, message],
    );
    touch?.(match.match_id, {
      id: message.id,
      body: message.body,
      created_at: message.created_at,
      is_mine: true,
    });
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

  // Days are grouped in the viewer's timezone, which the server cannot know;
  // until hydration both sides group by UTC date so the markup matches.
  const dayKey = (iso: string) =>
    hydrated ? new Date(iso).toDateString() : iso.slice(0, 10);

  const partnerLanguages = match.partner.languages
    .map((l) =>
      l.role === "native"
        ? `Speaks ${l.language_name}`
        : `Learning ${l.language_name} ${l.cefr_level}`,
    )
    .join(" · ");

  return (
    <div
      ref={rootRef}
      className="flex h-[var(--vvh,100dvh)] min-h-0 flex-col overflow-hidden"
    >
      <header className="safe-top shrink-0 border-b border-line bg-surface/90 backdrop-blur-lg">
        <div className="mx-auto flex min-h-14 max-w-3xl items-center gap-2 px-2 py-1.5 md:min-h-16 md:px-gutter">
          {/* On desktop the list is right there, so there is nothing to go back to. */}
          <Link
            href="/messages"
            aria-label="Back to messages"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunken lg:hidden"
          >
            <BackIcon className="size-5" />
          </Link>
          <Avatar
            storagePath={match.partner.primary_photo_path}
            name={match.partner.first_name}
            userId={match.partner.id}
            size={40}
          />
          <div className="min-w-0 flex-1 pl-1">
            <p className="truncate text-[0.9375rem] font-bold text-ink">
              {match.partner.first_name}
            </p>
            <p className="truncate text-xs text-faint md:text-xs">
              {partnerLanguages}
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

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <div
            ref={contentRef}
            className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-3 px-gutter py-4"
          >
            {hasMore && (
              <button
                type="button"
                onClick={loadOlder}
                disabled={loadingOlder}
                className="mx-auto block rounded-full bg-sunken px-4 py-2 text-xs font-semibold text-muted hover:text-ink disabled:opacity-60"
              >
                {loadingOlder ? "Loading…" : "Load earlier messages"}
              </button>
            )}

            {messages.length === 0 && (
              <div className="my-auto py-10 text-center">
                <p className="text-sm text-muted">
                  You matched with {match.partner.first_name}.
                </p>
                <p className="mt-1 text-sm text-faint">
                  The mission above is a decent place to start.
                </p>
              </div>
            )}

            {messages.map((message, i) => {
              const previous = messages[i - 1];
              const showDivider =
                !previous || dayKey(previous.created_at) !== dayKey(message.created_at);
              return (
                <div key={message.id} className="flex flex-col gap-3">
                  {showDivider && (
                    <LocalTime
                      iso={message.created_at}
                      format="day"
                      className="py-1 text-center text-xs font-medium text-faint"
                    />
                  )}
                  <MessageBubble
                    message={message}
                    isMine={message.sender_id === viewerId}
                    onReply={() => setReplyTo(message)}
                    onCorrect={() => setCorrecting(message)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {unseen && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="animate-rise absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-ink shadow-lg shadow-brand/25"
          >
            <ArrowDownIcon className="size-3.5" /> New message
          </button>
        )}
      </div>

      <MessageInput
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={handleSend}
        disabled={!isActive}
        initialValue={initialDraft?.text}
        draftNote={
          initialDraft
            ? "From your lesson — change it however you like. Sending it earns +10 XP."
            : undefined
        }
      />

      <CorrectionComposer
        message={correcting}
        onClose={() => setCorrecting(null)}
        onSubmit={handleCorrection}
      />
    </div>
  );
}
