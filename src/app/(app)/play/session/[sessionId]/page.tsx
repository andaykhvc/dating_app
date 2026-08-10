import { notFound } from "next/navigation";
import { GameSessionRenderer } from "@/features/games/components/GameSessionRenderer";
import { createClient } from "@/lib/supabase/server";
import type { GameSession } from "@/features/games/engine/types";

export default async function GameSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_game_session", {
    p_session_id: sessionId,
  });

  if (!data) notFound();

  const session = data as GameSession & { match_id: string | null };
  const returnTo = session.match_id ? `/messages/${session.match_id}` : "/play";

  return <GameSessionRenderer session={session} returnTo={returnTo} />;
}
