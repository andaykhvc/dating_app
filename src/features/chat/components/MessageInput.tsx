"use client";

import { useEffect, useRef, useState } from "react";
import { SendIcon } from "@/components/icons";
import type { ChatMessage } from "@/types/domain";

export function MessageInput({
  replyTo,
  onCancelReply,
  onSend,
  disabled,
}: {
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (body: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  async function submit() {
    const body = value.trim();
    if (!body || sending) return;
    setSending(true);
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
    <div className="safe-bottom sticky bottom-0 border-t border-line bg-raised/95 backdrop-blur-lg">
      {replyTo && (
        <div className="mx-auto flex max-w-md items-center gap-2 border-b border-line px-4 py-2">
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
            className="rounded-full px-2 py-1 text-sm text-faint hover:bg-sunken"
          >
            ×
          </button>
        </div>
      )}

      <div className="mx-auto flex max-w-md items-end gap-2 px-4 py-3">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={disabled ? "This conversation has ended" : "Write something…"}
          className="max-h-32 flex-1 resize-none rounded-3xl border border-line bg-surface px-4 py-2.5 text-[0.9375rem] text-ink outline-none placeholder:text-faint focus:border-brand disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || sending || disabled}
          aria-label="Send message"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink transition-transform active:scale-95 disabled:opacity-40"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
