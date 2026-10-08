"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { LocalTime } from "@/components/ui/LocalTime";
import { SectionLabel } from "@/components/layout/Page";
import { FORWARD } from "@/components/motion/PushTransition";
import { useLiveMatches } from "@/features/chat/ConversationsContext";
import type { MatchSummary } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * The conversation list, used full-width on phones and as the left pane of the
 * desktop split view. `compact` is the docked sidebar: tighter, and kept fresh
 * from whatever the page beside it last fetched.
 */
export function ConversationList({
  matches,
  compact = false,
}: {
  matches: MatchSummary[];
  compact?: boolean;
}) {
  const pathname = usePathname();
  const live = useLiveMatches(matches, { followSnapshot: compact });
  const withMessages = live.filter((m) => m.last_message);
  const waiting = live.filter((m) => !m.last_message);
  const activeId = pathname.split("/")[2];

  if (live.length === 0) {
    return (
      <p className={cn("text-sm text-muted", compact && "px-5 py-6")}>
        Conversations appear once you match with someone.
      </p>
    );
  }

  return (
    <div className={cn(compact ? "py-3" : "")}>
      {waiting.length > 0 && (
        <section className={cn("mb-5", compact && "px-4")}>
          <SectionLabel className={cn(!compact && "px-1")}>
            Say the first thing
          </SectionLabel>
          {/* Scrolls sideways inside itself; bleeds to the screen edge on phones. */}
          <ul
            className={cn(
              "scrollbar-none flex snap-x gap-3 overflow-x-auto pb-1",
              compact
                ? "-mx-4 scroll-px-4 px-4"
                : "-mx-gutter scroll-px-[var(--gutter)] px-gutter",
            )}
          >
            {waiting.map((match) => {
              const active = match.match_id === activeId;
              return (
                <li key={match.match_id} className="shrink-0 snap-start">
                  <Link
                    href={`/messages/${match.match_id}`}
                    {...(compact ? {} : FORWARD)}
                    aria-current={active ? "page" : undefined}
                    className="press flex w-[4.25rem] flex-col items-center gap-1.5 rounded-2xl py-1"
                  >
                    <Avatar
                      storagePath={match.partner.primary_photo_path}
                      name={match.partner.first_name}
                      userId={match.partner.id}
                      size={compact ? 56 : 60}
                      className={cn(
                        "ring-2 ring-offset-2 ring-offset-surface",
                        active ? "ring-brand" : "ring-brand/40",
                      )}
                    />
                    <span className="w-full truncate text-center text-xs font-medium text-ink">
                      {match.partner.first_name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {withMessages.length > 0 && (
        <ul
          className={cn(
            "grouped-rows",
            compact ? "px-2 [--row-inset:4.5rem]" : "-mx-2 [--row-inset:5rem]",
          )}
        >
          {withMessages.map((match) => {
            const active = match.match_id === activeId;
            const last = match.last_message!;
            return (
              <li key={match.match_id}>
                <Link
                  href={`/messages/${match.match_id}`}
                  {...(compact ? {} : FORWARD)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "press-soft flex items-center gap-3.5 rounded-2xl px-2 py-3",
                    active ? "bg-brand-soft" : "hover:bg-fill active:bg-fill",
                  )}
                >
                  <Avatar
                    storagePath={match.partner.primary_photo_path}
                    name={match.partner.first_name}
                    userId={match.partner.id}
                    size={compact ? 48 : 52}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[1.0625rem] font-semibold tracking-[-0.015em] text-ink">
                        {match.partner.first_name}
                      </p>
                      <LocalTime
                        iso={last.created_at}
                        format="relative"
                        className="shrink-0 text-xs text-faint"
                      />
                    </div>
                    <p className="truncate text-[0.9375rem] text-muted">
                      {last.is_mine && <span className="text-faint">You: </span>}
                      {last.body}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
