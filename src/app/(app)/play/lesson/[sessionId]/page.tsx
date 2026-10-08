import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/features/learn/components/LessonPlayer";
import { createClient } from "@/lib/supabase/server";
import type { LessonSession } from "@/features/learn/types";
import { PushTransition } from "@/components/motion/PushTransition";

export const metadata: Metadata = { title: "Lesson" };

/**
 * Reopening a lesson by id (refresh, deep link) goes through the same
 * answer-stripping read as starting one; only the owner gets anything back.
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_lesson_session", { p_session_id: sessionId });
  if (!data) notFound();

  const session = data as LessonSession;
  return (
    <PushTransition>
      <LessonPlayer key={session.session_id} initial={session} />
    </PushTransition>
  );
}
