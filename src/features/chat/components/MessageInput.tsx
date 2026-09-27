"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SendIcon } from "@/components/icons";
import type { ChatMessage } from "@/types/domain";

const MAX_HEIGHT_PX = 160;

export function MessageInput({
  replyTo,
  onCancelReply,
  onSend,
  disabled,
  initialValue = "",
  draftNote,
}: {
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (body: string) => Promise<void>;
  disabled?: boolean;
  /** Prefilled text, e.g. a phrase from a lesson. Never sent automatically. */
  initialValue?: string;
  /** Shown above the composer while the prefilled text is still there. */
  draftNote?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [showNote, setShowNote] = useState(Boolean(draftNote && initialValue));
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  // Grows with the message up to a few lines, then scrolls inside itself.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  async function submit() {
    const body = value.trim();
    if (!body || sending) return;
    setSending(true);
    setShowNote(false);
    setValue("");
    try {
      await onSend(body);
    } catch {
      setValue(body);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="safe-bottom safe-x shrink-0 border-t border-line bg-raised/95 backdrop-blur-lg">
      {showNote && draftNote && (
        <div className="mx-auto flex max-w-3xl items-center gap-2 border-b border-line px-gutter py-1.5">
          <p className="min-w-0 flex-1 text-xs text-brand">{draftNote}</p>
          <button
            type="button"
            onClick={() => setShowNote(false)}
            aria-label="Dismiss"
            className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-faint hover:bg-sunken hover:text-ink"
          >
            ×
          </button>
        </div>
      )}
      {replyTo && (
        <div className="mx-auto flex max-w-3xl items-center gap-2 border-b border-line px-gutter py-1.5">
          <div className="min-w-0 flex-1 border-l-2 border-brand pl-2.5">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-brand">
              Replying to
            </p>
            <p className="truncate text-xs text-muted">{replyTo.body}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-faint hover:bg-sunken hover:text-ink"
          >
            ×
          </button>
        </div>
      )}

      <div className="mx-auto flex max-w-3xl items-end gap-2 px-gutter py-2.5 md:py-3">
        {/* 16px text: anything smaller and iOS zooms the page on focus. */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            // Enter while an IME is composing (Japanese, Chinese, Korean…)
            // confirms the characters; it must not send a half-typed message.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          disabled={disabled}
          enterKeyHint="send"
          aria-label="Message"
          placeholder={disabled ? "This conversation has ended" : "Write something…"}
          className="min-h-11 flex-1 resize-none rounded-3xl border border-line bg-surface px-4 py-2.5 text-base leading-snug text-ink outline-none placeholder:text-faint focus:border-brand disabled:opacity-60"
        />
        <button
          type="button"
          // Keeps focus (and the phone keyboard) in the textarea after sending.
          onPointerDown={(e) => e.preventDefault()}
          onClick={submit}
          disabled={!value.trim() || sending || disabled}
          aria-label="Send message"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink transition-transform hover:bg-brand-strong active:scale-90 disabled:opacity-40"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
