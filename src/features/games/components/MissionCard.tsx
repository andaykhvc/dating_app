"use client";

import { useState } from "react";
import Link from "next/link";
import { advanceMission } from "@/features/chat/api";
import { startGameSession } from "@/features/games/api";
import type { MatchMission } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Sits at the top of every thread. This is what stops a match turning into two
 * people saying "hey" and never speaking again.
 */
export function MissionCard({
  mission,
  matchId,
  onCompleted,
}: {
  mission: MatchMission;
  matchId: string;
  onCompleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [steps, setSteps] = useState(mission.steps_completed);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function markStep() {
    setBusy(true);
    try {
      const result = await advanceMission(mission.match_mission_id);
      setSteps(result.steps_completed);
      setFlash(
        result.mission_completed
          ? `Mission complete · +${result.xp_awarded} XP`
          : `+${result.xp_awarded} XP`,
      );
      if (result.mission_completed) {
        window.setTimeout(onCompleted, 1400);
      }
    } catch {
      setFlash("Could not save that step.");
    } finally {
      setBusy(false);
      window.setTimeout(() => setFlash(null), 2600);
    }
  }

  async function openChallenge() {
    if (!mission.game_template_id) return;
    setStartingGame(true);
    try {
      const session = await startGameSession(
        mission.game_template_id,
        matchId,
        mission.match_mission_id,
      );
      setSessionId(session.session_id);
    } catch {
      setFlash("Could not start that challenge.");
      setStartingGame(false);
    }
  }

  const pct = Math.round((steps / mission.target_steps) * 100);

  return (
    <div className="border-b border-line bg-accent-soft/60">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mx-auto flex w-full max-w-md items-center gap-3 px-5 py-3 text-left"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-base">
          🎯
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.625rem] font-bold uppercase tracking-[0.12em] text-accent">
            Mission · {steps}/{mission.target_steps}
          </span>
          <span className="block truncate text-sm font-semibold text-ink">
            {mission.title}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 text-xs text-muted transition-transform",
            expanded && "rotate-180",
          )}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="mx-auto max-w-md space-y-3 px-5 pb-4">
          <p className="text-sm leading-relaxed text-muted">
            {mission.description}
          </p>

          <div className="h-1.5 overflow-hidden rounded-full bg-accent/15">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={markStep}
              disabled={busy || steps >= mission.target_steps}
              className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {steps >= mission.target_steps
                ? "Done"
                : `Mark step done · +${mission.xp_reward_per_step} XP`}
            </button>

            {mission.game_template_id &&
              (sessionId ? (
                <Link
                  href={`/play/session/${sessionId}`}
                  className="rounded-full border border-accent/40 px-4 py-2 text-xs font-bold text-accent"
                >
                  Open challenge
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openChallenge}
                  disabled={startingGame}
                  className="rounded-full border border-accent/40 px-4 py-2 text-xs font-bold text-accent disabled:opacity-50"
                >
                  {startingGame ? "Loading…" : "Play it as a challenge"}
                </button>
              ))}
          </div>

          {flash && (
            <p className="text-xs font-semibold text-accent" role="status">
              {flash}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
