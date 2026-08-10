import Link from "next/link";
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { PencilIcon } from "@/components/icons";
import {
  LeagueTag,
  StreakFlame,
  XPBar,
} from "@/features/progress/components/ProgressBadges";
import { createClient } from "@/lib/supabase/server";
import { COUNTRY_BY_CODE, INTENTION_LABELS } from "@/lib/constants";
import { ageFromDateOfBirth } from "@/lib/date";
import { one } from "@/lib/utils";
import type { Intention, UserProgress } from "@/types/domain";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: progress }, { data: languages }, { data: interests }] =
    await Promise.all([
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
        action={
          <Link
            href="/profile/settings"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-sunken"
          >
            Settings
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-md space-y-5 px-5 py-5">
        <section className="flex items-center gap-4">
          <Avatar
            storagePath={profile?.primary_photo_path ?? null}
            name={profile?.first_name ?? null}
            userId={user!.id}
            size={76}
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-bold text-ink">
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
          className="flex items-center justify-center gap-2 rounded-full border border-line bg-raised py-3 text-sm font-semibold text-ink transition-colors hover:border-brand/40"
        >
          <PencilIcon /> Edit profile
        </Link>

        {xp && (
          <section className="rounded-3xl border border-line bg-raised p-5">
            <XPBar progress={xp} />
            <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[
                ["Total XP", xp.total_xp],
                ["Streak", `${xp.current_streak_days}d`],
                ["Best", `${xp.longest_streak_days}d`],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-2xl bg-sunken py-3">
                  <dt className="text-[0.6875rem] uppercase tracking-wide text-faint">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-lg font-bold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="rounded-3xl border border-line bg-raised p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">
            Languages
          </h3>
          <div className="mt-3 space-y-2">
            {native && (
              <p className="text-sm text-ink">
                <span className="text-muted">Native:</span> {native.flag_emoji}{" "}
                {native.name}
              </p>
            )}
            {learning && (
              <p className="text-sm text-ink">
                <span className="text-muted">Learning:</span>{" "}
                {learning.flag_emoji} {learning.name} —{" "}
                <span className="font-semibold text-brand">
                  {learningRow?.cefr_level}
                </span>
              </p>
            )}
          </div>
        </section>

        {profile?.bio && (
          <section className="rounded-3xl border border-line bg-raised p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">
              About
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink">{profile.bio}</p>
          </section>
        )}

        <section className="rounded-3xl border border-line bg-raised p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">
            Here for
          </h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
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
        </section>

        {interests && interests.length > 0 && (
          <section className="rounded-3xl border border-line bg-raised p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">
              Interests
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {interests.map((row) => {
                const interest = one(row.interests);
                return (
                  <Chip key={interest?.key}>
                    {interest?.emoji} {interest?.label}
                  </Chip>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
