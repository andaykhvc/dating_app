import type { Metadata } from "next";
import { TopBar } from "@/components/layout/TopBar";
import { PlayHub, type PlayOverview } from "@/features/games/components/PlayHub";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Play" };

export default async function PlayPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_play_overview");

  return (
    <>
      <TopBar title="Play" subtitle="Daily challenge, missions and XP" />
      <PlayHub overview={data as PlayOverview} />
    </>
  );
}
