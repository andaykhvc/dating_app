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
      <header className="material safe-top sticky top-0 z-20 shadow-[0_0.5px_0_var(--separator)]">
        <div className="mx-auto flex min-h-14 max-w-2xl items-center gap-2 px-2 py-1.5 md:min-h-16 md:px-gutter">
          <button
            type="button"
            onClick={() => router.push(returnTo)}
            aria-label="Leave challenge"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-fill md:-ml-2"
          >
            <BackIcon className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.9375rem] font-bold text-ink">
              {session.template.title}
            </p>
            <p className="text-xs text-faint md:text-xs">
              {session.content.language_code.toUpperCase()} ·{" "}
              {session.content.cefr_level} · +{session.template.xp_reward} XP
            </p>
          </div>
        </div>
      </header>

      {/* Reading width on every screen; the footer inside each template is
          sticky, so the action stays reachable however long the content. */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-gutter pt-6 md:pt-12">
        {error && (
          <p role="alert" className="mb-4 rounded-2xl bg-negative-soft px-4 py-3 text-center text-sm text-negative">
            {error}
          </p>
        )}
        {renderTemplate()}
      </div>
    </div>
  );
}
