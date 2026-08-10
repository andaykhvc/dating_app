import type { CefrLevel } from "@/types/domain";

/**
 * The contract between seeded content and the renderers.
 *
 * Payloads arrive from game_content.payload with the answer key already
 * stripped by strip_answer() in Postgres — grading happens server-side, so the
 * browser is never told what the right answer is until it submits one.
 */
export const GAME_TEMPLATE_TYPES = [
  "missing_word",
  "translation_choice",
  "word_order",
  "ask_your_partner",
  "conversation_mission",
  "voice_challenge",
  "correction_challenge",
] as const;

export type GameTemplateType = (typeof GAME_TEMPLATE_TYPES)[number];

export type MissingWordPayload = {
  sentence: string;
  choices: string[];
};

export type TranslationChoicePayload = {
  prompt: string;
  prompt_language: string;
  choices: string[];
};

export type WordOrderPayload = {
  tokens: string[];
};

export type AskYourPartnerPayload = {
  prompt: string;
};

export type ConversationMissionPayload = {
  instructions: string;
  suggested_questions: string[];
  target_exchanges: number;
};

export type VoiceChallengePayload = {
  instructions: string;
};

export type CorrectionChallengePayload = {
  seed_sentence?: string;
  hint?: string;
};

export type GamePayload =
  | ({ type: "missing_word" } & MissingWordPayload)
  | ({ type: "translation_choice" } & TranslationChoicePayload)
  | ({ type: "word_order" } & WordOrderPayload)
  | ({ type: "ask_your_partner" } & AskYourPartnerPayload)
  | ({ type: "conversation_mission" } & ConversationMissionPayload)
  | ({ type: "voice_challenge" } & VoiceChallengePayload)
  | ({ type: "correction_challenge" } & CorrectionChallengePayload);

export type GameTemplate = {
  id: number;
  key: string;
  type: GameTemplateType;
  title: string;
  description: string;
  instructions: string | null;
  is_gradable: boolean;
  xp_reward: number;
};

export type GameContent = {
  id: string;
  language_code: string;
  cefr_level: CefrLevel;
  payload: Record<string, unknown>;
};

export type GameSession = {
  session_id: string;
  template: GameTemplate;
  content: GameContent | null;
};

/** What the client submits. Never includes a correctness claim. */
export type GameAnswer = { answer?: string; note?: string };

export type GameResult = {
  already_completed: boolean;
  is_correct: boolean | null;
  correct_answer?: string | null;
  xp_awarded: number;
};

/** Props every template renderer receives. */
export type TemplateProps = {
  session: GameSession;
  onSubmit: (answer: GameAnswer) => void;
  result: GameResult | null;
  submitting: boolean;
};
