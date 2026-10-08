import Link from "next/link";
import type { Metadata } from "next";
import { BackIcon } from "@/components/icons";
import { PageBody, SectionLabel } from "@/components/layout/Page";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Leaderboard, LeaderboardEntry } from "@/features/progress/types";
import { PushTransition } from "@/components/motion/PushTransition";

export const metadata: Metadata = { title: "XP rankings" };

function RankingRow({
  entry,
  isYou,
}: {
  entry: LeaderboardEntry;
  isYou: boolean;
}) {
  return (
    <Link
      href={`/play/rankings/${entry.id}`} transitionTypes={["nav-forward"]}
      className={cn(
        "press-soft flex min-h-20 items-center gap-3 rounded-[1.125rem] p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:gap-4 sm:p-4",
        isYou
          ? "bg-brand-soft shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand)_30%,transparent)]"
          : "bg-raised shadow-[var(--shadow-card)] hover:brightness-[0.98] dark:hover:brightness-110",
      )}
      aria-label={`View ${entry.first_name}'s profile, rank ${entry.rank}, ${entry.total_xp} XP${isYou ? ", you" : ""}`}
    >
      <span
        className={cn(
          "w-9 shrink-0 text-center text-sm font-bold tabular-nums",
          entry.rank <= 3 ? "text-accent-ink" : "text-muted",
        )}
      >
        #{entry.rank}
      </span>
      <Avatar
        storagePath={entry.primary_photo_path}
        name={entry.first_name}
        userId={entry.id}
        size={44}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-semibold text-ink">
          {entry.first_name}
        </span>
        <span className="block text-xs text-muted">
          Level {entry.level}
          {isYou ? " · You" : ""}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-bold tabular-nums text-brand">
          {entry.total_xp.toLocaleString("en-US")}
        </span>
        <span className="block text-xs text-faint">XP</span>
      </span>
      <span aria-hidden="true" className="hidden text-faint sm:block">
        ›
      </span>
    </Link>
  );
}

export default async function RankingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_xp_leaderboard");
  if (error) throw new Error("Could not load XP rankings.");
  const leaderboard = data as Leaderboard;

  return (
    <PushTransition>
      <TopBar
        title="XP rankings"
        subtitle="All-time learning XP"
        leading={
          <Link
            href="/play" transitionTypes={["nav-back"]}
            aria-label="Back to Learn"
            className="rounded-full p-2 hover:bg-fill"
          >
            <BackIcon />
          </Link>
        }
      />
      <PageBody className="space-y-6">
        <section className="surface-card p-6">
          <span aria-hidden="true" className="text-4xl">
            🏆
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink">
            Every lesson counts.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Keep learning, earn XP and climb the rankings. Tap a learner to
            explore their profile.
          </p>
        </section>
        {leaderboard.current_user && (
          <section aria-labelledby="your-ranking">
            <h2
              id="your-ranking"
              className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-faint"
            >
              Your ranking
            </h2>
            <RankingRow entry={leaderboard.current_user} isYou />
          </section>
        )}
        <section>
          <SectionLabel>Top 50 learners</SectionLabel>
          <p className="mb-4 text-xs text-muted">
            Ranked by total XP. Equal XP shares the same rank.
          </p>
          {leaderboard.entries.length ? (
            <ol className="space-y-2" aria-label="XP rankings">
              {leaderboard.entries.map((entry) => (
                <li key={entry.id}>
                  <RankingRow
                    entry={entry}
                    isYou={entry.id === leaderboard.current_user?.id}
                  />
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">
              No learners to show yet. Complete a lesson to start earning XP.
            </p>
          )}
        </section>
      </PageBody>
    </PushTransition>
  );
}
