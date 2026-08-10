"use client";

import {
  CheckSmallIcon,
  DoubleCheckIcon,
  PencilIcon,
  ReplyIcon,
} from "@/components/icons";
import { formatMessageTime } from "@/lib/date";
import type { ChatMessage } from "@/types/domain";
import { cn } from "@/lib/utils";

export function MessageBubble({
  message,
  isMine,
  onReply,
  onCorrect,
}: {
  message: ChatMessage;
  isMine: boolean;
  onReply: () => void;
  onCorrect: () => void;
}) {
  const correction = message.correction;

  return (
    <div className={cn("group flex flex-col", isMine ? "items-end" : "items-start")}>
      <div className={cn("flex max-w-[85%] items-end gap-1.5", isMine && "flex-row-reverse")}>
        <div
          className={cn(
            "rounded-3xl px-4 py-2.5",
            isMine
              ? "rounded-br-lg bg-brand text-brand-ink"
              : "rounded-bl-lg bg-raised text-ink ring-1 ring-line",
          )}
        >
          {message.reply_to && (
            <div
              className={cn(
                "mb-2 rounded-xl border-l-2 py-1 pl-2.5 text-xs",
                isMine
                  ? "border-white/45 text-brand-ink/75"
                  : "border-brand/40 text-muted",
              )}
            >
              <span className="line-clamp-2">{message.reply_to.body}</span>
            </div>
          )}

          <p
            className={cn(
              "whitespace-pre-wrap break-words text-[0.9375rem] leading-relaxed",
              // A corrected sentence stays visible but steps back, so the
              // corrected version below is what the eye lands on.
              correction && "opacity-60",
            )}
          >
            {message.body}
          </p>

          <span
            className={cn(
              "mt-1 flex items-center justify-end gap-1 text-[0.625rem]",
              isMine ? "text-brand-ink/65" : "text-faint",
            )}
          >
            {formatMessageTime(message.created_at)}
            {isMine &&
              (message.delivery_state === "delivered" ? (
                <DoubleCheckIcon className="size-3" />
              ) : (
                <CheckSmallIcon className="size-3" />
              ))}
          </span>
        </div>

        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={onReply}
            aria-label="Reply to this message"
            className="rounded-full p-1.5 text-faint hover:bg-sunken hover:text-ink"
          >
            <ReplyIcon />
          </button>
          {!isMine && !correction && (
            <button
              type="button"
              onClick={onCorrect}
              aria-label="Suggest a correction"
              className="rounded-full p-1.5 text-faint hover:bg-brand-soft hover:text-brand"
            >
              <PencilIcon />
            </button>
          )}
        </div>
      </div>

      {correction && (
        <div
          className={cn(
            "mt-1.5 max-w-[85%] rounded-2xl border border-positive/30 bg-positive-soft px-3.5 py-2.5",
            isMine ? "rounded-tr-md" : "rounded-tl-md",
          )}
        >
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-positive">
            Correction
          </p>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink">
            {correction.corrected_text}
          </p>
          {correction.note && (
            <p className="mt-1.5 text-xs italic text-muted">{correction.note}</p>
          )}
        </div>
      )}
    </div>
  );
}
