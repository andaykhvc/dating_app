"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { completeGameSession } from "@/features/games/api";
import { MissingWord } from "./templates/MissingWord";
import { TranslationChoice } from "./templates/TranslationChoice";
import { WordOrder } from "./templates/WordOrder";
import {
  AskYourPartner,
  ConversationMission,
  CorrectionChallenge,
  VoiceChallenge,
} from "./templates/OpenPractice";
import type {
  GameAnswer,
  GameResult,
  GameSession,
} from "@/features/games/engine/types";

/**
 * The whole dispatch. Adding a new *exercise* is a seed-data row and touches
 * nothing here; only a genuinely new mechanic needs a new branch.
 */
export function GameSessionRenderer({
  session,
  returnTo,
}: {
  session: GameSession;
  returnTo: string;
}) {
  const router = useRouter();
  const [result, setResult] = useState<GameResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(answer: GameAnswer) {
    setSubmitting(true);
    setError(null);
    try {
      setResult(await completeGameSession(session.session_id, answer));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that.");
    } finally {
      setSubmitting(false);
    }
  }

  function onDone() {
    router.push(returnTo);
    router.refresh();
  }

  const props = { session, onSubmit, result, submitting, onDone };

  if (!session.content) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-sm text-muted">
          There is no content for this challenge in your language yet.
        </p>
        <button
          onClick={onDone}
          className="mt-4 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink"
        >
          Go back
        </button>
      </div>
    );
  }

  function renderTemplate() {
    switch (session.template.type) {
      case "missing_word":
        return <MissingWord {...props} />;
      case "translation_choice":
        return <TranslationChoice {...props} />;
      case "word_order":
        return <WordOrder {...props} />;
      case "ask_your_partner":
        return <AskYourPartner {...props} />;
      case "conversation_mission":
        return <ConversationMission {...props} />;
      case "voice_challenge":
        return <VoiceChallenge {...props} />;
      case "correction_challenge":
        return <CorrectionChallenge {...props} />;
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-top sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-3">
          <button
            type="button"
            onClick={() => router.push(returnTo)}
            aria-label="Leave challenge"
            className="rounded-full p-2 text-muted hover:bg-sunken"
          >
            <BackIcon className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">
              {session.template.title}
            </p>
            <p className="text-[0.6875rem] text-faint">
              {session.content.language_code.toUpperCase()} ·{" "}
              {session.content.cefr_level} · +{session.template.xp_reward} XP
            </p>
          </div>
        </div>
      </header>

      <div className="safe-bottom mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-7">
        {renderTemplate()}
        {error && (
          <p role="alert" className="mt-3 text-center text-xs text-negative">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
