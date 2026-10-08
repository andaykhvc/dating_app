import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeRunPlayer } from "@/features/games/components/PracticeRunPlayer";
import type { PracticeRun } from "@/features/games/api";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Challenge" };

/**
 * Reopening a run by id (refresh, deep link) goes through the same
 * answer-stripping read as starting one; only the owner gets anything back, and
 * the answers already given come with it, so the player resumes at the right card.
 */
export default async function PracticeRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_practice_run", { p_run_id: runId });
  const run = data as PracticeRun | null;
  if (!run || !run.available) notFound();

  return <PracticeRunPlayer key={run.run_id} initial={run} />;
}
