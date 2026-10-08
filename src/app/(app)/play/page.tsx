import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { PlayHub, type PlayOverview } from "@/features/games/components/PlayHub";
import type { LearnOverview } from "@/features/learn/types";
import { createClient } from "@/lib/supabase/server";
import { PushTransition } from "@/components/motion/PushTransition";

export const metadata: Metadata = { title: "Learn" };

export default async function PlayPage() {
  const supabase = await createClient();
  // Two shaped reads in parallel: the existing challenges/missions hub and the
  // course syllabus with progress. Each is a single function call.
  const [{ data: play }, { data: learn }] = await Promise.all([
    supabase.rpc("get_play_overview"),
    supabase.rpc("get_learn_overview"),
  ]);

  const course = (learn as LearnOverview | null)?.course;

  return (
    <PushTransition>
      <TopBar
        title="Learn"
        subtitle={
          course
            ? `${course.target.flag_emoji ?? ""} ${course.target.name} course, missions and XP`
            : "Lessons, missions and XP"
        }
        width="wide"
      />
      <PlayHub
        overview={play as PlayOverview}
        learn={(learn as LearnOverview | null) ?? { course: null, review: null, next_lesson: null, units: [] }}
      />
    </PushTransition>
  );
}
