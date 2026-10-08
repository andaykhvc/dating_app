"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StreakFlame } from "@/features/progress/components/ProgressBadges";
import type { PracticeFinish, PracticeKind } from "@/features/games/api";

/** Shown once, after the last card: score, XP (the only place it appears), streak. */
export function PracticeSummary({
  summary,
  kind,
  total,
  onAnother,
}: {
  summary: PracticeFinish;
  kind: PracticeKind;
  total: number;
  onAnother?: () => Promise<void>;
}) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function another() {
    if (!onAnother || starting) return;
    setStarting(true);
    setError(null);
    try {
      await onAnother();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start another one.");
      setStarting(false);
    }
  }

  const earned = summary.xp_awarded > 0;
  const repeatDaily = kind === "daily" && summary.first_daily_today === false;

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-gutter pb-safe-8 pt-safe-10 md:pt-safe-16">
        <div className="animate-pop space-y-2 text-center">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-accent">
            {kind === "daily" ? "Daily challenge done" : "Challenge done"}
          </p>
          <h1 className="text-balance text-[clamp(1.75rem,6vw,2.5rem)] font-bold leading-tight tracking-tight text-ink">
            {summary.perfect ? "Not a single slip." : earned ? "Nicely done." : "Good practice."}
          </h1>
        </div>

        <dl className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-sunken px-3 py-4 text-center">
            <dt className="text-[0.6875rem] uppercase tracking-wide text-faint">Score</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums text-ink">
              {summary.correct} / {total}
            </dd>
          </div>
          <div className="rounded-2xl bg-accent-soft px-3 py-4 text-center">
            <dt className="text-[0.6875rem] uppercase tracking-wide text-faint">XP earned</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums text-accent">+{summary.xp_awarded}</dd>
          </div>
        </dl>

        {!earned && (
          <p className="text-center text-sm text-muted">
            Get at least 3 right the first time to earn XP. Your answers still helped your reviews.
          </p>
        )}
        {repeatDaily && earned && (
          <p className="text-center text-sm text-muted">Repeating the daily challenge earns less XP.</p>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-muted">
          <StreakFlame days={summary.streak_days ?? 0} />
          <span>
            {summary.streak_days
              ? `${summary.streak_days}-day streak`
              : "Practise again tomorrow to start a streak"}
          </span>
        </div>

        {error && (
          <p role="alert" className="text-center text-sm text-negative">
            {error}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2.5">
          {onAnother && (
            <Button size="lg" fullWidth loading={starting} onClick={another}>
              Another one
            </Button>
          )}
          <Link
            href="/play"
            className="flex h-14 w-full items-center justify-center rounded-full border border-line bg-raised px-6 text-base font-semibold text-ink hover:border-brand/40"
          >
            Back to Play
          </Link>
        </div>
      </main>
    </div>
  );
}
