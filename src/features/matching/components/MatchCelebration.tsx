"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { one } from "@/lib/utils";
import type { DiscoveryCard, MatchMission } from "@/types/domain";
import { SPRING, SPRING_PLAYFUL, haptic } from "@/lib/motion";

/** One beat after another: the headline, the face, the mission, the actions. */
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { ...SPRING, delay } },
});

/**
 * The moment the whole product hangs on: a match hands over a mission, not an
 * empty text box. The mission is already attached in the database by the time
 * this renders — record_swipe creates both in one transaction.
 */
export function MatchCelebration({
  matchId,
  partner,
  onDismiss,
}: {
  matchId: string;
  partner: DiscoveryCard;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const [mission, setMission] = useState<MatchMission | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  // The one moment in the app that earns a celebratory tick.
  useEffect(() => {
    haptic([12, 60, 18]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("match_missions")
        .select(
          "id, steps_completed, missions(title, description, target_steps, xp_reward_per_step, related_game_template_id)",
        )
        .eq("match_id", matchId)
        .eq("status", "active")
        .maybeSingle();

      const template = one(data?.missions);
      if (cancelled || !template) return;
      setMission({
        match_mission_id: data!.id,
        title: template.title,
        description: template.description,
        steps_completed: data!.steps_completed,
        target_steps: template.target_steps,
        xp_reward_per_step: template.xp_reward_per_step,
        game_template_id: template.related_game_template_id,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return (
    // Scrolls inside itself, so the buttons are never stranded below the fold
    // of a short phone or a phone turned sideways. The backdrop arrives as a
    // material — blur and opacity together — and leaves the same way.
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-x-0 top-0 z-50 h-svh overflow-y-auto overscroll-contain bg-surface/85"
    >
      {/* A soft brand glow behind the face, so the moment has some warmth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(60%_50%_at_50%_30%,color-mix(in_oklab,var(--brand)_22%,transparent),transparent)]"
      />
      <div className="relative flex min-h-full items-center justify-center px-gutter pb-safe-8 pt-safe-8">
        <motion.div
          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
          className="w-full max-w-sm text-center"
        >
          <motion.p
            {...rise(0.05)}
            className="text-sm font-semibold uppercase tracking-[0.2em] text-brand"
          >
            It&apos;s a match
          </motion.p>
          <motion.h2
            {...rise(0.1)}
            id={titleId}
            className="mt-2 text-[2rem] font-bold leading-tight text-ink [overflow-wrap:anywhere]"
          >
            You and {partner.first_name}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, transition: { ...SPRING_PLAYFUL, delay: 0.16 } }}
            className="mx-auto mt-7 flex justify-center short:mt-5"
          >
            <span className="rounded-full p-1.5 shadow-[0_20px_50px_-18px_var(--brand)] [background:conic-gradient(from_200deg,var(--brand),var(--accent),var(--brand))]">
              <Avatar
                storagePath={partner.primary_photo_path}
                name={partner.first_name}
                userId={partner.id}
                size={120}
                className="ring-4 ring-surface"
              />
            </span>
          </motion.div>

          <motion.div
            {...rise(0.28)}
            className="surface-card mt-8 p-5 text-left short:mt-5"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">
              Today&apos;s mission
            </p>
            {mission ? (
              <div className="animate-fade">
                <h3 className="mt-2 text-lg font-bold leading-snug text-ink">
                  {mission.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {mission.description}
                </p>
                <p className="mt-3 text-sm font-semibold text-accent-ink">
                  +{mission.xp_reward_per_step} XP each
                </p>
              </div>
            ) : (
              <div aria-label="Picking your first mission" className="mt-3 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded-full" />
                <div className="skeleton h-3 w-full rounded-full" />
              </div>
            )}
          </motion.div>

          <motion.div {...rise(0.36)} className="mt-6 space-y-2">
            <Button
              size="lg"
              fullWidth
              onClick={() => router.push(`/messages/${matchId}`, { transitionTypes: ["nav-forward"] })}
            >
              Say something
            </Button>
            <Button variant="ghost" fullWidth onClick={onDismiss}>
              Keep swiping
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
