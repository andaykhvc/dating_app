"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LeagueTag,
  StreakFlame,
  XPBar,
} from "@/features/progress/components/ProgressBadges";
import { SectionLabel } from "@/components/layout/Page";
import { startGameSession } from "@/features/games/api";
import { CourseCard, Syllabus } from "@/features/learn/components/CourseOverview";
import type { LearnOverview } from "@/features/learn/types";
import type { UserProgress } from "@/types/domain";
import { LeaderboardLink } from "@/features/progress/components/LeaderboardLink";

type PracticeTemplate = {
  game_template_id: number;
  key: string;
  type: string;
  title: string;
  description: string;
  xp_reward: number;
};

type DailyChallenge = PracticeTemplate & { completed_today: boolean };

type ActiveMission = {
  match_mission_id: string;
  match_id: string;
  partner_first_name: string;
  partner_photo_path: string | null;
  title: string;
  description: string;
  steps_completed: number;
  target_steps: number;
  xp_reward_per_step: number;
  game_template_id: number | null;
};

export type PlayOverview = {
  progress: UserProgress | null;
  daily_challenge: DailyChallenge | null;
  match_missions: ActiveMission[];
  practice: PracticeTemplate[];
  learning_language: string | null;
};

/**
 * One column on phones. On desktop the "you" half (progress, the course card
 * and today's challenge) stays pinned on the left while the syllabus, missions
 * and practice — the lists that grow — scroll on the right.
 */
export function PlayHub({
  overview,
  learn,
}: {
  overview: PlayOverview;
  learn: LearnOverview;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function play(templateId: number) {
    setStarting(templateId);
    setError(null);
    try {
      const session = await startGameSession(templateId);
      router.push(`/play/session/${session.session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start that.");
      setStarting(null);
    }
  }

  const { progress, daily_challenge: daily, match_missions: missions } = overview;

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-gutter py-5 md:gap-6 md:py-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8">
      <div className="space-y-4 md:space-y-6 lg:sticky lg:top-24">
        {progress && (
          <section className="rounded-3xl border border-line bg-raised p-5 md:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <LeagueTag league={progress.league} />
              <StreakFlame days={progress.current_streak_days} />
              <span className="ml-auto text-xs text-faint">
                {progress.total_xp} XP total
              </span>
            </div>
            <XPBar progress={progress} />
            {progress.current_streak_days === 0 && (
              <p className="mt-3 text-xs text-muted">
                Practise any lesson today to start a streak.
              </p>
            )}
          </section>
        )}

        <LeaderboardLink />
        <CourseCard overview={learn} />

        {daily && (
          <section>
            <SectionLabel>Daily challenge</SectionLabel>
            <button
              type="button"
              onClick={() => play(daily.game_template_id)}
              disabled={starting !== null}
              className="w-full rounded-3xl bg-brand p-5 text-left text-brand-ink transition-[transform,background-color] hover:bg-brand-strong active:scale-[0.99] disabled:opacity-70 md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold md:text-xl">{daily.title}</p>
                  <p className="mt-1 text-sm opacity-85">{daily.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
                  +{daily.xp_reward}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold">
                {daily.completed_today
                  ? "Done today — play it again"
                  : starting === daily.game_template_id
                    ? "Loading…"
                    : "Start →"}
              </p>
            </button>
          </section>
        )}
      </div>

      <div className="space-y-4 md:space-y-6">
        {learn.units && learn.units.length > 0 && (
          <section>
            <SectionLabel>Your course</SectionLabel>
            <Syllabus overview={learn} />
          </section>
        )}

        <section>
          <SectionLabel>Missions with your matches</SectionLabel>
          {missions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line p-5 text-center">
              <p className="text-sm text-muted">
                No missions in flight. Every new match starts one.
              </p>
              <Link
                href="/discover"
                className="mt-3 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-strong"
              >
                Find someone
              </Link>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {missions.map((mission) => (
                <li key={mission.match_mission_id}>
                  <Link
                    href={`/messages/${mission.match_id}`}
                    className="block rounded-3xl border border-line bg-raised p-4 transition-colors hover:border-accent/40 active:bg-sunken md:p-5"
                  >
                    <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-accent-ink">
                      With {mission.partner_first_name} ·{" "}
                      {mission.steps_completed}/{mission.target_steps}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {mission.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                      {mission.description}
                    </p>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sunken">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${(mission.steps_completed / mission.target_steps) * 100}%`,
                        }}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionLabel>Quick challenges</SectionLabel>
          {overview.practice.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line p-5 text-center text-sm text-muted">
              No solo content for your target language yet.
            </p>
          ) : (
            <ul className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,16rem),1fr))]">
              {overview.practice.map((template) => (
                <li key={template.game_template_id}>
                  <button
                    type="button"
                    onClick={() => play(template.game_template_id)}
                    disabled={starting !== null}
                    className="flex h-full w-full items-center gap-3 rounded-3xl border border-line bg-raised p-4 text-left transition-colors hover:border-brand/40 active:bg-sunken disabled:opacity-60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">
                        {starting === template.game_template_id
                          ? "Loading…"
                          : template.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {template.description}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
                      +{template.xp_reward}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {error && (
          <p role="alert" className="text-center text-xs text-negative">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
