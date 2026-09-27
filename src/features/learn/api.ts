import { createClient } from "@/lib/supabase/client";
import type {
  ExerciseAnswer,
  ExerciseResult,
  FlagReason,
  LessonCompletion,
  LessonSession,
} from "@/features/learn/types";

/**
 * Every call is one RPC. Lessons are generated, graded and scored inside
 * Postgres from our own tables: no external API, no AI, no per-question cost
 * beyond a single small round trip.
 */

export async function startLesson(lessonId: number, audio: boolean): Promise<LessonSession> {
  const { data, error } = await createClient().rpc("start_lesson", {
    p_lesson_id: lessonId,
    p_audio: audio,
  });
  if (error) throw error;
  return data as LessonSession;
}

export async function startReview(audio: boolean): Promise<LessonSession> {
  const { data, error } = await createClient().rpc("start_review", { p_audio: audio });
  if (error) throw error;
  return data as LessonSession;
}

export async function answerExercise(
  sessionId: string,
  index: number,
  answer: ExerciseAnswer,
): Promise<ExerciseResult> {
  const { data, error } = await createClient().rpc("answer_lesson_exercise", {
    p_session_id: sessionId,
    p_index: index,
    p_answer: answer,
  });
  if (error) throw error;
  return data as ExerciseResult;
}

export async function completeLesson(sessionId: string): Promise<LessonCompletion> {
  const { data, error } = await createClient().rpc("complete_lesson_session", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return data as LessonCompletion;
}

/** Records the intent and returns the phrase; nothing is sent to anyone. */
export async function sharePhrase(matchId: string, conceptId: number) {
  const { data, error } = await createClient().rpc("share_phrase_with_match", {
    p_match_id: matchId,
    p_concept_id: conceptId,
  });
  if (error) throw error;
  return data as { share_id: string; text: string; match_id: string };
}

export async function flagExercise(
  sessionId: string,
  index: number,
  reason: FlagReason,
  note: string,
) {
  const { error } = await createClient().rpc("flag_lesson_content", {
    p_session_id: sessionId,
    p_index: index,
    p_reason: reason,
    p_note: note.trim() || null,
  });
  if (error) throw error;
}
