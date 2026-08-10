"use client";

import { useState } from "react";
import { ChoiceButton, GameFooter, Instructions, Prompt } from "./shared";
import type {
  TemplateProps,
  TranslationChoicePayload,
} from "@/features/games/engine/types";

export function TranslationChoice({
  session,
  onSubmit,
  result,
  submitting,
  onDone,
}: TemplateProps & { onDone: () => void }) {
  const payload = session.content?.payload as unknown as TranslationChoicePayload;
  const [choice, setChoice] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-7">
      <Instructions>Which one means the same thing?</Instructions>
      <Prompt>{payload?.prompt}</Prompt>

      <div className="space-y-2.5">
        {payload?.choices.map((option) => (
          <ChoiceButton
            key={option}
            label={option}
            selected={choice === option}
            state={
              !result
                ? "idle"
                : option === result.correct_answer
                  ? "correct"
                  : choice === option
                    ? "wrong"
                    : "idle"
            }
            onClick={() => setChoice(option)}
            disabled={result !== null}
          />
        ))}
      </div>

      <div className="mt-auto">
        <GameFooter
          result={result}
          submitting={submitting}
          canSubmit={choice !== null}
          onSubmit={() => onSubmit({ answer: choice ?? "" })}
          onDone={onDone}
        />
      </div>
    </div>
  );
}
