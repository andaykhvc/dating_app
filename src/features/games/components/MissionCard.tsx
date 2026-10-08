"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { advanceMission } from "@/features/chat/api";
import { startGameSession } from "@/features/games/api";
import type { MatchMission } from "@/types/domain";
import { SPRING, SPRING_SNAPPY, haptic } from "@/lib/motion";

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
      haptic(result.mission_completed ? [10, 50, 14] : 8);
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
    <div className="relative z-[1] shrink-0 bg-accent-soft/70 shadow-[0_0.5px_0_var(--separator)] backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mx-auto flex w-full max-w-3xl items-center gap-3 px-gutter py-2.5 text-left short:py-2"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-accent/15 text-base short:size-8">
          🎯
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold uppercase tracking-[0.12em] text-accent-ink">
            Mission · {steps}/{mission.target_steps}
          </span>
          <span className="block truncate text-sm font-semibold text-ink">
            {mission.title}
          </span>
        </span>
        <motion.span
          aria-hidden
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={SPRING_SNAPPY}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs text-accent-ink"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          key="details"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={SPRING}
          className="overflow-hidden"
        >
        <div className="mx-auto max-w-3xl space-y-3 px-gutter pb-4">
          <p className="text-sm leading-relaxed text-muted">
            {mission.description}
          </p>

          <div className="h-1.5 overflow-hidden rounded-full bg-accent/15">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={markStep}
              disabled={busy || steps >= mission.target_steps}
              className="press min-h-11 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {steps >= mission.target_steps
                ? "Done"
                : `Mark step done · +${mission.xp_reward_per_step} XP`}
            </button>

            {mission.game_template_id &&
              (sessionId ? (
                <Link
                  href={`/play/session/${sessionId}`} transitionTypes={["nav-forward"]}
                  className="press flex min-h-11 items-center rounded-full bg-accent/12 px-4 py-2 text-xs font-bold text-accent-ink"
                >
                  Open challenge
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openChallenge}
                  disabled={startingGame}
                  className="press min-h-11 rounded-full bg-accent/12 px-4 py-2 text-xs font-bold text-accent-ink disabled:opacity-50"
                >
                  {startingGame ? "Loading…" : "Play it as a challenge"}
                </button>
              ))}
          </div>

          {flash && (
            <p className="animate-pop text-xs font-semibold text-accent-ink" role="status">
              {flash}
            </p>
          )}
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
