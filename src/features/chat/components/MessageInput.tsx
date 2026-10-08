"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SendIcon } from "@/components/icons";
import type { ChatMessage } from "@/types/domain";
import { cn } from "@/lib/utils";

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
  const [sendError, setSendError] = useState<string | null>(null);
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
    setSendError(null);
    setShowNote(false);
    setValue("");
    try {
      await onSend(body);
    } catch {
      // Put the text back for another try, unless they have already started
      // typing something else, and say what happened: the message used to
      // vanish and reappear with no explanation.
      setValue((typed) => typed || body);
      setSendError("Message not sent. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="material safe-bottom safe-x relative z-10 shrink-0 shadow-[0_-0.5px_0_var(--separator)]">
      {showNote && draftNote && (
        <div className="animate-fade mx-auto flex max-w-3xl items-center gap-2 px-gutter py-1.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
          <p className="min-w-0 flex-1 text-xs text-brand">{draftNote}</p>
          <button
            type="button"
            onClick={() => setShowNote(false)}
            aria-label="Dismiss"
            className="press -mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-faint hover:bg-fill hover:text-ink"
          >
            ×
          </button>
        </div>
      )}
      {replyTo && (
        <div className="animate-rise mx-auto flex max-w-3xl items-center gap-2 px-gutter py-1.5 shadow-[inset_0_-0.5px_0_var(--separator)]">
          <div className="min-w-0 flex-1 border-l-[3px] border-brand pl-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              Replying to
            </p>
            <p className="truncate text-xs text-muted">{replyTo.body}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="press -mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-faint hover:bg-fill hover:text-ink"
          >
            ×
          </button>
        </div>
      )}

      {sendError && (
        <p
          role="alert"
          className="mx-auto max-w-3xl px-gutter pt-2 text-xs font-medium text-negative"
        >
          {sendError}
        </p>
      )}

      <div className="mx-auto flex max-w-3xl items-end gap-2 px-gutter py-2 md:py-3">
        {/* 16px text: anything smaller and iOS zooms the page on focus. */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.slice(0, 2000));
            setSendError(null);
          }}
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
          className="min-h-11 flex-1 resize-none rounded-[1.375rem] border border-transparent bg-fill px-4 py-2.5 text-base leading-snug text-ink outline-none transition-[background-color,border-color,box-shadow] duration-200 ease-ios placeholder:text-faint focus:border-brand/40 focus:bg-raised focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_14%,transparent)] focus-visible:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          // Keeps focus (and the phone keyboard) in the textarea after sending.
          onPointerDown={(e) => e.preventDefault()}
          onClick={submit}
          disabled={!value.trim() || sending || disabled}
          aria-label="Send message"
          // Like iMessage: the send button grows into place once there is
          // something to send, and steps back again when the field is empty.
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink transition-[transform,opacity,background-color] duration-300 ease-ios hover:bg-brand-strong active:scale-90 disabled:cursor-not-allowed",
            value.trim() ? "scale-100 opacity-100" : "scale-[0.82] opacity-35",
          )}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
