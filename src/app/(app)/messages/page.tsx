import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDay } from "@/lib/date";
import type { MatchSummary } from "@/types/domain";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_matches");
  const matches = ((data ?? []) as MatchSummary[]).filter(
    (m) => m.status === "active",
  );

  const withMessages = matches.filter((m) => m.last_message);
  const waiting = matches.filter((m) => !m.last_message);

  return (
    <>
      <TopBar title="Messages" />

      {matches.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-2xl">
            💬
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink">Nothing here yet</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            Conversations appear once you match with someone.
          </p>
          <Link
            href="/discover"
            className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-ink"
          >
            Find someone
          </Link>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-md px-5 py-4">
          {waiting.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
                Say the first thing
              </h2>
              <ul className="flex gap-4 overflow-x-auto pb-1">
                {waiting.map((match) => (
                  <li key={match.match_id} className="shrink-0">
                    <Link
                      href={`/messages/${match.match_id}`}
                      className="flex w-16 flex-col items-center gap-1.5"
                    >
                      <Avatar
                        storagePath={match.partner.primary_photo_path}
                        name={match.partner.first_name}
                        userId={match.partner.id}
                        size={60}
                        className="ring-2 ring-brand/40"
                      />
                      <span className="w-full truncate text-center text-xs text-muted">
                        {match.partner.first_name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ul className="space-y-1">
            {withMessages.map((match) => (
              <li key={match.match_id}>
                <Link
                  href={`/messages/${match.match_id}`}
                  className="flex items-center gap-3.5 rounded-2xl px-2 py-3 transition-colors hover:bg-sunken"
                >
                  <Avatar
                    storagePath={match.partner.primary_photo_path}
                    name={match.partner.first_name}
                    userId={match.partner.id}
                    size={52}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold text-ink">
                        {match.partner.first_name}
                      </p>
                      <span className="shrink-0 text-[0.6875rem] text-faint">
                        {formatRelativeDay(match.last_message!.created_at)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted">
                      {match.last_message!.is_mine && (
                        <span className="text-faint">You: </span>
                      )}
                      {match.last_message!.body}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
