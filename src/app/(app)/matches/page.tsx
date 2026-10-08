import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { PageBody } from "@/components/layout/Page";
import { Avatar } from "@/components/ui/Avatar";
import { getActiveMatches } from "@/lib/supabase/queries";
import { COUNTRY_BY_CODE } from "@/lib/constants";
import { FORWARD, PushTransition } from "@/components/motion/PushTransition";

export const metadata: Metadata = { title: "Matches" };

export default async function MatchesPage() {
  const matches = await getActiveMatches();

  return (
    <PushTransition>
      <TopBar
        title="Matches"
        width="wide"
        subtitle={
          matches.length > 0
            ? `${matches.length} ${matches.length === 1 ? "person" : "people"}`
            : undefined
        }
      />

      {matches.length === 0 ? (
        <div className="stagger flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
          <div className="flex size-20 items-center justify-center rounded-[1.5rem] bg-brand-soft text-3xl shadow-[var(--shadow-card)]">
            🤝
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink">No matches yet</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            When you and someone else both say yes, you land here — with a
            mission already waiting.
          </p>
          <Link
            href="/discover"
            className="press mt-6 rounded-full bg-brand px-6 py-3 text-[0.9375rem] font-semibold text-brand-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_20px_-10px_var(--brand)] hover:bg-brand-strong"
          >
            Start swiping
          </Link>
        </div>
      ) : (
        <PageBody width="wide">
          {/* One column on phones, then as many ~20rem cards as fit. */}
          <ul className="stagger grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))] md:gap-4">
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
                    {...FORWARD}
                    className="flex h-full flex-col surface-card press-soft p-4 hover:brightness-[0.98] dark:hover:brightness-110 md:p-5"
                  >
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        storagePath={match.partner.primary_photo_path}
                        name={match.partner.first_name}
                        userId={match.partner.id}
                        size={56}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[1.0625rem] font-semibold tracking-[-0.015em] text-ink">
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
                      <div className="mt-3.5 rounded-[1rem] bg-accent-soft px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-ink">
                          Mission · {match.mission.steps_completed}/
                          {match.mission.target_steps}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-sm font-medium text-ink">
                          {match.mission.title}
                        </p>
                      </div>
                    )}

                    <p className="mt-auto truncate pt-3 text-sm text-muted">
                      {match.last_message ? (
                        <>
                          {match.last_message.is_mine && (
                            <span className="text-faint">You: </span>
                          )}
                          {match.last_message.body}
                        </>
                      ) : (
                        <span className="font-medium text-brand">
                          Say the first thing →
                        </span>
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </PageBody>
      )}
    </PushTransition>
  );
}
