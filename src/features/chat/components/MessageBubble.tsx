"use client";

import { useState } from "react";
import {
  CheckSmallIcon,
  DoubleCheckIcon,
  PencilIcon,
  ReplyIcon,
} from "@/components/icons";
import { LocalTime } from "@/components/ui/LocalTime";
import type { ChatMessage } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Reply and correct used to appear only on hover, which never happens on a
 * phone — so the core "tap a message to correct it" loop was invisible there.
 * Now a tap on the bubble opens labelled actions underneath it on touch
 * screens, while mouse users keep the quiet hover icons beside it.
 */
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
  const [open, setOpen] = useState(false);
  const correction = message.correction;
  const canCorrect = !isMine && !correction;

  const act = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className={cn("group flex flex-col", isMine ? "items-end" : "items-start")}>
      <div className="relative max-w-[min(80%,34rem)]">
        <div
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "cursor-default rounded-3xl px-4 py-2.5 transition-[filter]",
            isMine
              ? "rounded-br-lg bg-brand text-brand-ink"
              : "rounded-bl-lg bg-raised text-ink ring-1 ring-line",
            open && "brightness-95",
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
              <span className="line-clamp-2 [overflow-wrap:anywhere]">
                {message.reply_to.body}
              </span>
            </div>
          )}

          <p
            className={cn(
              // `anywhere` rather than `break-word`, so a long URL or an
              // unbroken word also shrinks the bubble's min width instead of
              // pushing it past the edge of the screen.
              "whitespace-pre-wrap text-[0.9375rem] leading-relaxed [overflow-wrap:anywhere]",
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
            <LocalTime iso={message.created_at} format="time" />
            {isMine &&
              (message.delivery_state === "delivered" ? (
                <DoubleCheckIcon className="size-3" />
              ) : (
                <CheckSmallIcon className="size-3" />
              ))}
          </span>
        </div>

        <div
          className={cn(
            // Touch: a row of labelled buttons under the bubble, after a tap.
            "mt-1.5 gap-1.5",
            open ? "flex" : "hidden",
            isMine && "justify-end",
            // Mouse: icons floating beside the bubble, on hover or focus.
            "pointer-fine:absolute pointer-fine:bottom-0 pointer-fine:mt-0 pointer-fine:flex pointer-fine:gap-0.5",
            "pointer-fine:pointer-events-none pointer-fine:opacity-0 pointer-fine:transition-opacity",
            "pointer-fine:group-hover:pointer-events-auto pointer-fine:group-hover:opacity-100",
            "pointer-fine:focus-within:pointer-events-auto pointer-fine:focus-within:opacity-100",
            open && "pointer-fine:pointer-events-auto pointer-fine:opacity-100",
            isMine ? "pointer-fine:right-full pointer-fine:mr-1" : "pointer-fine:left-full pointer-fine:ml-1",
          )}
        >
          <ActionButton
            label="Reply"
            ariaLabel="Reply to this message"
            onClick={act(onReply)}
          >
            <ReplyIcon />
          </ActionButton>
          {canCorrect && (
            <ActionButton
              label="Correct"
              ariaLabel="Suggest a correction"
              onClick={act(onCorrect)}
              tone="brand"
            >
              <PencilIcon />
            </ActionButton>
          )}
        </div>
      </div>

      {correction && (
        <div
          className={cn(
            "mt-1.5 max-w-[min(80%,34rem)] rounded-2xl border border-positive/30 bg-positive-soft px-3.5 py-2.5",
            isMine ? "rounded-tr-md" : "rounded-tl-md",
          )}
        >
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-positive">
            Correction
          </p>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink [overflow-wrap:anywhere]">
            {correction.corrected_text}
          </p>
          {correction.note && (
            <p className="mt-1.5 text-xs italic text-muted [overflow-wrap:anywhere]">
              {correction.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  ariaLabel,
  onClick,
  tone = "neutral",
  children,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  tone?: "neutral" | "brand";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full border border-line bg-raised px-3 text-xs font-semibold transition-colors",
        "pointer-fine:w-8 pointer-fine:justify-center pointer-fine:border-0 pointer-fine:bg-transparent pointer-fine:px-0 pointer-fine:text-faint",
        tone === "brand"
          ? "text-brand pointer-fine:hover:bg-brand-soft pointer-fine:hover:text-brand"
          : "text-ink pointer-fine:hover:bg-sunken pointer-fine:hover:text-ink",
      )}
    >
      {children}
      <span className="pointer-fine:sr-only">{label}</span>
    </button>
  );
}
