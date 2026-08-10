"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LeagueTag,
  StreakFlame,
  XPBar,
} from "@/features/progress/components/ProgressBadges";
import { startGameSession } from "@/features/games/api";
import type { UserProgress } from "@/types/domain";

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

export function PlayHub({ overview }: { overview: PlayOverview }) {
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
    <div className="mx-auto w-full max-w-md space-y-4 px-5 py-5">
      {progress && (
        <section className="rounded-3xl border border-line bg-raised p-5">
          <div className="mb-4 flex items-center gap-2">
            <LeagueTag league={progress.league} />
            <StreakFlame days={progress.current_streak_days} />
            <span className="ml-auto text-xs text-faint">
              {progress.total_xp} XP total
            </span>
          </div>
          <XPBar progress={progress} />
          {progress.current_streak_days === 0 && (
            <p className="mt-3 text-xs text-muted">
              Earn any XP today to start a streak.
            </p>
          )}
        </section>
      )}

      {daily && (
        <section>
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-faint">
            Daily challenge
          </h2>
          <button
            type="button"
            onClick={() => play(daily.game_template_id)}
            disabled={starting !== null}
            className="w-full rounded-3xl bg-brand p-5 text-left text-brand-ink transition-transform active:scale-[0.99] disabled:opacity-70"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold">{daily.title}</p>
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
                  : "Start"}
            </p>
          </button>
        </section>
      )}

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-faint">
          Missions with your matches
        </h2>
        {missions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-5 text-center">
            <p className="text-sm text-muted">
              No missions in flight. Every new match starts one.
            </p>
            <Link
              href="/discover"
              className="mt-3 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink"
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
                  className="block rounded-3xl border border-line bg-raised p-4 transition-colors hover:border-accent/40"
                >
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-accent">
                    With {mission.partner_first_name} ·{" "}
                    {mission.steps_completed}/{mission.target_steps}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {mission.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
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
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-faint">
          Practice on your own
        </h2>
        {overview.practice.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line p-5 text-center text-sm text-muted">
            No solo content for your target language yet.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {overview.practice.map((template) => (
              <li key={template.game_template_id}>
                <button
                  type="button"
                  onClick={() => play(template.game_template_id)}
                  disabled={starting !== null}
                  className="flex w-full items-center gap-3 rounded-3xl border border-line bg-raised p-4 text-left transition-colors hover:border-brand/40 disabled:opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {template.title}
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
  );
}
