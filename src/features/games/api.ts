import { createClient } from "@/lib/supabase/client";
import type {
  GameAnswer,
  GameResult,
  GameSession,
} from "@/features/games/engine/types";
import type {
  Exercise,
  ExerciseAnswer,
  ExerciseResult,
  LanguageInfo,
} from "@/features/learn/types";

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

/**
 * Practice runs (Daily and Quick challenges): five cards generated from the
 * course content, graded in Postgres, XP only when the run is finished.
 */
export type PracticeKind = "daily" | "quick";
export type PracticeStyle = "meaning" | "build" | "type" | "listen" | "mixed";

/** A run as the browser sees it: cards without answer keys, plus answers given so far. */
export type PracticeRunSession = {
  available: true;
  run_id: string;
  kind: PracticeKind;
  style: PracticeStyle | null;
  status: "in_progress" | "completed" | "abandoned";
  total: number;
  target: LanguageInfo;
  known: LanguageInfo;
  exercises: Exercise[];
  results: Record<string, ExerciseResult>;
};

export type PracticeRun =
  | { available: false; reason: "no_course" | "not_enough_content" }
  | PracticeRunSession;

export type PracticeFinish = {
  already_completed: boolean;
  kind: PracticeKind;
  xp_awarded: number;
  correct: number;
  total: number;
  graded?: number;
  perfect?: boolean;
  first_daily_today?: boolean;
  streak_days?: number;
  review_due?: number;
};

export async function startPracticeRun(
  kind: PracticeKind,
  options: { style?: PracticeStyle; audio?: boolean } = {},
): Promise<PracticeRun> {
  const { data, error } = await createClient().rpc("start_practice_run", {
    p_kind: kind,
    p_exercise_type: options.style ?? null,
    p_audio: options.audio ?? true,
  });
  if (error) throw error;
  return data as PracticeRun;
}

export async function getPracticeRun(runId: string): Promise<PracticeRun | null> {
  const { data, error } = await createClient().rpc("get_practice_run", { p_run_id: runId });
  if (error) throw error;
  return (data as PracticeRun | null) ?? null;
}

export async function answerPracticeCard(
  runId: string,
  index: number,
  answer: ExerciseAnswer,
): Promise<ExerciseResult> {
  const { data, error } = await createClient().rpc("answer_practice_card", {
    p_run_id: runId,
    p_card_index: index,
    p_answer: answer,
  });
  if (error) throw error;
  return data as ExerciseResult;
}

export async function finishPracticeRun(runId: string): Promise<PracticeFinish> {
  const { data, error } = await createClient().rpc("finish_practice_run", { p_run_id: runId });
  if (error) throw error;
  return data as PracticeFinish;
}
