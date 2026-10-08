import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { PageBody, SectionLabel } from "@/components/layout/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { PencilIcon } from "@/components/icons";
import {
  LeagueTag,
  StreakFlame,
  XPBar,
} from "@/features/progress/components/ProgressBadges";
import { ProfilePhotos } from "@/features/profile/ProfilePhotos";
import { LeaderboardLink } from "@/features/progress/components/LeaderboardLink";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import {
  CEFR_DESCRIPTIONS,
  COUNTRY_BY_CODE,
  INTENTION_LABELS,
} from "@/lib/constants";
import { ageFromDateOfBirth } from "@/lib/date";
import { one } from "@/lib/utils";
import type { Intention, UserProgress } from "@/types/domain";

export const metadata: Metadata = { title: "Profile" };

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-raised p-5 md:p-6">
      {children}
    </section>
  );
}

export default async function ProfilePage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  const [
    { data: profile },
    { data: progress },
    { data: languages },
    { data: interests },
    { data: photos },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "first_name, date_of_birth, country_code, city, bio, intentions, primary_photo_path, hide_dating_profiles",
      )
      .eq("id", user!.id)
      .single(),
    supabase
      .from("user_progress")
      .select(
        "total_xp, level, league, current_streak_days, longest_streak_days, last_activity_date",
      )
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("user_languages")
      .select("role, cefr_level, languages(code, name, flag_emoji)")
      .eq("user_id", user!.id),
    supabase
      .from("user_interests")
      .select("interests(key, label, emoji)")
      .eq("user_id", user!.id),
    supabase
      .from("profile_photos")
      .select("id, storage_path")
      .eq("user_id", user!.id)
      .order("position"),
  ]);

  const country = profile?.country_code
    ? COUNTRY_BY_CODE.get(profile.country_code)
    : null;

  const nativeRow = languages?.find((l) => l.role === "native");
  const learningRow = languages?.find((l) => l.role === "learning");
  const native = one(nativeRow?.languages);
  const learning = one(learningRow?.languages);

  const xp: UserProgress | null = progress
    ? {
        ...progress,
        xp_into_level: progress.total_xp % 100,
        xp_for_next_level: 100,
      }
    : null;

  return (
    <>
      <TopBar
        title="Your profile"
        width="wide"
        action={
          <Link
            href="/profile/settings"
            className="rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-sunken hover:text-ink"
          >
            Settings
          </Link>
        }
      />

      <PageBody
        width="wide"
        className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-8"
      >
        {/* Who you are: beside the details on desktop, above them on phones. */}
        <div className="space-y-4 md:space-y-5">
          <section className="flex items-center gap-4 lg:flex-col lg:items-start">
            <Avatar
              storagePath={profile?.primary_photo_path ?? null}
              name={profile?.first_name ?? null}
              userId={user!.id}
              size={76}
              className="lg:hidden"
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-bold text-ink md:text-3xl">
                {profile?.first_name}
                {profile?.date_of_birth &&
                  `, ${ageFromDateOfBirth(profile.date_of_birth)}`}
              </h2>
              <p className="truncate text-sm text-muted">
                {[profile?.city, country?.name].filter(Boolean).join(", ")}{" "}
                {country?.flag}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {xp && <LeagueTag league={xp.league} />}
                {xp && <StreakFlame days={xp.current_streak_days} />}
              </div>
            </div>
          </section>

          <Link
            href="/profile/edit"
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-raised py-3 text-sm font-semibold text-ink transition-colors hover:border-brand/40"
          >
            <PencilIcon /> Edit profile
          </Link>

          {photos && photos.length > 0 && (
            <ProfilePhotos photos={photos} name={profile?.first_name ?? ""} />
          )}
        </div>

        <div className="space-y-4 md:space-y-5">
          {xp && (
            <Card>
              <XPBar progress={xp} />
              <dl className="mt-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
                {[
                  ["Total XP", xp.total_xp],
                  ["Streak", `${xp.current_streak_days}d`],
                  ["Best", `${xp.longest_streak_days}d`],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-2xl bg-sunken px-1 py-3">
                    <dt className="truncate text-xs uppercase tracking-wide text-faint">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-lg font-bold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          <LeaderboardLink />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <Card>
              <SectionLabel>Languages</SectionLabel>
              <div className="space-y-2.5">
                {native && (
                  <p className="text-sm text-ink">
                    <span className="text-muted">Native:</span>{" "}
                    {native.flag_emoji} {native.name}
                  </p>
                )}
                {learning && (
                  <p className="text-sm text-ink">
                    <span className="text-muted">Learning:</span>{" "}
                    {learning.flag_emoji} {learning.name} —{" "}
                    <span className="font-semibold text-brand">
                      {learningRow?.cefr_level}
                    </span>
                    {learningRow?.cefr_level && (
                      <span className="block text-xs text-faint">
                        {CEFR_DESCRIPTIONS[learningRow.cefr_level]}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </Card>

            <Card>
              <SectionLabel>Here for</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {(profile?.intentions as Intention[] | undefined)?.map((i) => (
                  <Chip key={i} tone={i === "open_to_dating" ? "accent" : "brand"}>
                    {INTENTION_LABELS[i]}
                  </Chip>
                ))}
              </div>
              {profile?.hide_dating_profiles && (
                <p className="mt-3 text-xs text-faint">
                  Your feed is set to language partners only.
                </p>
              )}
            </Card>
          </div>

          {profile?.bio && (
            <Card>
              <SectionLabel>About</SectionLabel>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink [overflow-wrap:anywhere] md:text-[0.9375rem]">
                {profile.bio}
              </p>
            </Card>
          )}

          {interests && interests.length > 0 && (
            <Card>
              <SectionLabel>Interests</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((row) => {
                  const interest = one(row.interests);
                  return (
                    <Chip key={interest?.key}>
                      {interest?.emoji} {interest?.label}
                    </Chip>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </PageBody>
    </>
  );
}
