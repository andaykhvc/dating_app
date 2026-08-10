import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/server";
import { COUNTRY_BY_CODE } from "@/lib/constants";
import type { MatchSummary } from "@/types/domain";

export const metadata: Metadata = { title: "Matches" };

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_matches");
  const matches = ((data ?? []) as MatchSummary[]).filter(
    (m) => m.status === "active",
  );

  return (
    <>
      <TopBar
        title="Matches"
        subtitle={
          matches.length > 0
            ? `${matches.length} ${matches.length === 1 ? "person" : "people"}`
            : undefined
        }
      />

      {matches.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-2xl">
            🤝
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink">No matches yet</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            When you and someone else both say yes, you land here — with a
            mission already waiting.
          </p>
          <Link
            href="/discover"
            className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-ink"
          >
            Start swiping
          </Link>
        </div>
      ) : (
        <ul className="mx-auto w-full max-w-md space-y-3 px-5 py-5">
          {matches.map((match) => {
            const country = COUNTRY_BY_CODE.get(match.partner.country_code);
            const learning = match.partner.languages.find(
              (l) => l.role === "learning",
            );
            const native = match.partner.languages.find(
              (l) => l.role === "native",
            );

            return (
              <li key={match.match_id}>
                <Link
                  href={`/messages/${match.match_id}`}
                  className="block rounded-3xl border border-line bg-raised p-4 transition-colors hover:border-brand/40"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      storagePath={match.partner.primary_photo_path}
                      name={match.partner.first_name}
                      userId={match.partner.id}
                      size={56}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink">
                        {match.partner.first_name}, {match.partner.age}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {country?.flag}{" "}
                        {[match.partner.city, country?.name]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="mt-1 truncate text-xs text-faint">
                        {native && `Speaks ${native.language_name}`}
                        {native && learning && " · "}
                        {learning &&
                          `Learning ${learning.language_name} ${learning.cefr_level}`}
                      </p>
                    </div>
                  </div>

                  {match.mission && (
                    <div className="mt-3.5 rounded-2xl bg-accent-soft px-4 py-3">
                      <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-accent">
                        Mission · {match.mission.steps_completed}/
                        {match.mission.target_steps}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-ink">
                        {match.mission.title}
                      </p>
                    </div>
                  )}

                  {match.last_message && (
                    <p className="mt-3 truncate text-sm text-muted">
                      {match.last_message.is_mine && (
                        <span className="text-faint">You: </span>
                      )}
                      {match.last_message.body}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
