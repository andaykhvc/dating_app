"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { one } from "@/lib/utils";
import type { DiscoveryCard, MatchMission } from "@/types/domain";

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
  const [mission, setMission] = useState<MatchMission | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/95 px-6 backdrop-blur-md">
      <div className="animate-rise w-full max-w-sm text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          It&apos;s a match
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
          You and {partner.first_name}
        </h2>

        <div className="animate-pop mx-auto mt-7 flex justify-center">
          <Avatar
            storagePath={partner.primary_photo_path}
            name={partner.first_name}
            userId={partner.id}
            size={112}
            className="ring-4 ring-brand/25"
          />
        </div>

        <div className="mt-8 rounded-3xl border border-line bg-raised p-5 text-left">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-accent">
            Today&apos;s mission
          </p>
          {mission ? (
            <>
              <h3 className="mt-2 text-lg font-bold leading-snug text-ink">
                {mission.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {mission.description}
              </p>
              <p className="mt-3 text-sm font-semibold text-accent">
                +{mission.xp_reward_per_step} XP each
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">Picking your first mission…</p>
          )}
        </div>

        <div className="mt-6 space-y-2">
          <Button
            size="lg"
            fullWidth
            onClick={() => router.push(`/messages/${matchId}`)}
          >
            Say something
          </Button>
          <Button variant="ghost" fullWidth onClick={onDismiss}>
            Keep swiping
          </Button>
        </div>
      </div>
    </div>
  );
}
