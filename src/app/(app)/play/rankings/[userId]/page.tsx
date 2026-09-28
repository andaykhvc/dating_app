import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { PageBody } from "@/components/layout/Page";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileDetails } from "@/features/discovery/components/ProfileDetails";
import {
  LeagueTag,
  LevelBadge,
} from "@/features/progress/components/ProgressBadges";
import { createClient } from "@/lib/supabase/server";
import type { ProfileCard } from "@/types/domain";

export const metadata: Metadata = { title: "Learner profile" };

export default async function LearnerProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  )
    notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_profile_card", {
    p_user_id: userId,
  });
  if (error) throw new Error("Could not load this profile.");
  if (!data) notFound();
  const card = data as ProfileCard;

  return (
    <>
      <TopBar
        title="Learner profile"
        leading={
          <Link
            href="/play/rankings"
            aria-label="Back to XP rankings"
            className="rounded-full p-2 hover:bg-sunken"
          >
            <BackIcon />
          </Link>
        }
      />
      <PageBody width="narrow">
        <article className="rounded-3xl border border-line bg-raised p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-4">
            <Avatar
              storagePath={card.primary_photo_path}
              name={card.first_name}
              userId={card.id}
              size={64}
            />
            <div className="min-w-0">
              <h2 className="break-words text-2xl font-bold text-ink">
                {card.first_name}
                {card.age != null ? `, ${card.age}` : ""}
              </h2>
              {card.progress && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <LevelBadge level={card.progress.level} />
                  <LeagueTag league={card.progress.league} />
                </div>
              )}
            </div>
          </div>
          <ProfileDetails card={card} full={card} />
        </article>
      </PageBody>
    </>
  );
}
