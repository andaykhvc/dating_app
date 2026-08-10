import { createClient } from "@/lib/supabase/client";
import type {
  GameAnswer,
  GameResult,
  GameSession,
} from "@/features/games/engine/types";

/**
 * The server picks the content row for the caller's target language and level,
 * and strips the answer key before sending it. The client never learns what the
 * right answer is until it has committed to one.
 */
export async function startGameSession(
  gameTemplateId: number,
  matchId?: string | null,
  matchMissionId?: string | null,
): Promise<GameSession> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("start_game_session", {
    p_game_template_id: gameTemplateId,
    p_match_id: matchId ?? null,
    p_match_mission_id: matchMissionId ?? null,
  });
  if (error) throw error;
  return data as GameSession;
}

/** Grading happens in Postgres; XP is written on the same trusted path. */
export async function completeGameSession(
  sessionId: string,
  answer: GameAnswer,
): Promise<GameResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("complete_game_session", {
    p_session_id: sessionId,
    p_answer: answer,
  });
  if (error) throw error;
  return data as GameResult;
}
