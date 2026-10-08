import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { StreakFlame } from "@/features/progress/components/ProgressBadges";
import { PhotoReviewNotice, type PhotoReviewState } from "@/features/profile/PhotoReviewNotice";
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
  const [{ data: cards }, { data: progress }, { data: me }, { data: myPhotos }] = await Promise.all([
    supabase.rpc("discover_profiles", { p_limit: DISCOVERY_BATCH_SIZE }),
    supabase
      .from("user_progress")
      .select("current_streak_days")
      .eq("user_id", user!.id)
      .single(),
    supabase.from("profiles").select("primary_photo_path").eq("id", user!.id).single(),
    supabase.from("profile_photos").select("moderation_status").eq("user_id", user!.id),
  ]);

  // Nobody is shown to others until one of their photos is approved.
  const photoState: PhotoReviewState | null = me?.primary_photo_path
    ? null
    : myPhotos?.some((p) => p.moderation_status === "pending")
      ? "pending"
      : myPhotos?.some((p) => p.moderation_status === "rejected")
        ? "rejected"
        : "none";

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
      {photoState && <PhotoReviewNotice state={photoState} />}
      <DiscoveryScreen initial={(cards ?? []) as DiscoveryCard[]} />
    </>
  );
}
