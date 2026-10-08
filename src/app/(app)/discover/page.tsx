import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { StreakFlame } from "@/features/progress/components/ProgressBadges";
import { DiscoveryScreen } from "@/features/discovery/components/DiscoveryScreen";
import { createClient } from "@/lib/supabase/server";
import { DISCOVERY_BATCH_SIZE } from "@/lib/constants";
import type { DiscoveryCard } from "@/types/domain";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const supabase = await createClient();

  // The first batch is rendered on the server so the deck is on screen
  // immediately; every batch after that is fetched by the client hook.
  const [{ data: cards }, { data: streak }] = await Promise.all([
    supabase.rpc("discover_profiles", { p_limit: DISCOVERY_BATCH_SIZE }),
    supabase.rpc("get_my_streak"),
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
            <StreakFlame days={streak?.current_streak_days ?? 0} />
          </Link>
        }
      />
      <DiscoveryScreen initial={(cards ?? []) as DiscoveryCard[]} />
    </>
  );
}
