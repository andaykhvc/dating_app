import type { CefrLevel } from "@/types/domain";

/**
 * Shapes returned by the learning RPCs in
 * supabase/migrations/99993_content_engine_functions.sql.
 *
 * Exercise payloads never contain an answer key; `ExerciseResult.expected`
 * arrives only after the learner has committed to an answer.
 */

export type LanguageInfo = {
  code: string;
  name: string;
  native_name?: string | null;
  flag_emoji: string | null;
  speech_locale: string | null;
};

export type LessonSummary = {
  id: number;
  title: string;
  lesson_type: "learn" | "practice";
  completed: boolean;
  best_score: number | null;
};

export type SkillSummary = {
  id: number;
  key: string;
  title: string;
  description: string | null;
  icon: string | null;
  mastery: number;
  lessons: LessonSummary[];
};

export type UnitSummary = {
  id: number;
  key: string;
  cefr_level: CefrLevel;
  title: string;
  description: string | null;
  skills: SkillSummary[];
};

export type NextLesson = {
  id: number;
  title: string;
  lesson_type: "learn" | "practice";
  skill_title: string;
  unit_title: string;
  cefr_level: CefrLevel;
};

export type ReviewStats = {
  due: number;
  learned: number;
  mastered: number;
  seen: number;
  next_due_at: string | null;
};

export type LearnOverview = {
  course: {
    target: LanguageInfo;
    known: LanguageInfo;
    level: CefrLevel | null;
    title: string;
    lessons_total: number;
    lessons_completed: number;
  } | null;
  target_code?: string | null;
  review: ReviewStats | null;
  next_lesson: NextLesson | null;
  units: UnitSummary[] | null;
};

export const EXERCISE_TYPES = [
  "new_words",
  "vocab_choice",
  "vocab_recall",
  "match_pairs",
  "type_translation",
  "listen_choice",
  "listen_type",
  "missing_word",
  "word_order",
  "word_bank",
  "sentence_choice",
  "true_false",
  "context_choice",
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export type Credit = {
  source: string;
  author: string | null;
  license: string;
  url: string | null;
};

export type ExercisePayload = {
  prompt?: string;
  prompt_lang?: string;
  speak?: string;
  choices?: string[];
  before?: string;
  after?: string;
  hint?: string;
  hint_lang?: string;
  tiles?: string[];
  statement?: string;
  statement_lang?: string;
  situation?: string;
  left?: { id: string; text: string }[];
  right?: { id: string; text: string }[];
  items?: {
    text: string;
    translation: string;
    speak: string;
    gender: string | null;
    note: string | null;
  }[];
  credit?: Credit;
};

export type Exercise = {
  index: number;
  type: ExerciseType;
  payload: ExercisePayload;
  is_retry: boolean;
};

/** What the learner did. Never a claim about whether it was right. */
export type ExerciseAnswer =
  | { choice: string }
  | { text: string }
  | { tokens: string[] }
  | { value: boolean }
  | { pairs: Record<string, string> }
  | { skip: true }
  | Record<string, never>;

export type ExerciseResult = {
  correct: boolean | null;
  note: "accents" | "skipped" | null;
  solution: string | null;
  graded: boolean;
  expected?: {
    choice?: string;
    value?: boolean;
    accept?: string[];
    pairs?: Record<string, string>;
  } | null;
  appended?: Exercise | null;
};

export type LessonSession = {
  session_id: string;
  mode: "lesson" | "review";
  status: "in_progress" | "completed" | "abandoned";
  lesson: {
    id: number;
    title: string;
    lesson_type: "learn" | "practice";
    skill_title: string;
    unit_title: string;
    cefr_level: CefrLevel;
  } | null;
  target: LanguageInfo;
  known: LanguageInfo;
  exercises: Exercise[];
  results: Record<string, ExerciseResult>;
};

export type SocialPhrase = {
  concept_id: number;
  text: string;
  translation: string;
  situation: string | null;
};

export type LessonCompletion = {
  already_completed: boolean;
  xp_awarded: number;
  score: number;
  perfect: boolean;
  first_completion: boolean;
  correct: number;
  graded: number;
  social_phrase: SocialPhrase | null;
  next_lesson: { id: number; title: string } | null;
  review_due: number;
};

export const FLAG_REASONS = [
  "wrong_translation",
  "typo",
  "unnatural",
  "offensive",
  "audio",
  "other",
] as const;
export type FlagReason = (typeof FLAG_REASONS)[number];
