import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { StreakFlame } from "@/features/progress/components/ProgressBadges";
import { DiscoveryScreen } from "@/features/discovery/components/DiscoveryScreen";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { DISCOVERY_BATCH_SIZE } from "@/lib/constants";
import type { DiscoveryCard } from "@/types/domain";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  // The first batch is rendered on the server so the deck is on screen
  // immediately; every batch after that is fetched by the client hook.
  const [{ data: cards }, { data: progress }] = await Promise.all([
    supabase.rpc("discover_profiles", { p_limit: DISCOVERY_BATCH_SIZE }),
    supabase
      .from("user_progress")
      .select("current_streak_days")
      .eq("user_id", user!.id)
      .single(),
  ]);

  return (
    <>
      <TopBar
        title="Discover"
        action={
          <Link
            href="/play"
            aria-label="Your streak"
            className="-m-1.5 rounded-full p-1.5"
          >
            <StreakFlame days={progress?.current_streak_days ?? 0} />
          </Link>
        }
      />
      <DiscoveryScreen initial={(cards ?? []) as DiscoveryCard[]} />
    </>
  );
}
