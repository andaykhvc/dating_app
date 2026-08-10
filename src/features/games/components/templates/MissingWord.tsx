"use client";

import { useState } from "react";
import { ChoiceButton, GameFooter, Instructions, Prompt } from "./shared";
import type { MissingWordPayload, TemplateProps } from "@/features/games/engine/types";

export function MissingWord({
  session,
  onSubmit,
  result,
  submitting,
  onDone,
}: TemplateProps & { onDone: () => void }) {
  const payload = session.content?.payload as unknown as MissingWordPayload;
  const [choice, setChoice] = useState<string | null>(null);

  const [before, after] = (payload?.sentence ?? "").split(/_{2,}/);

  return (
    <div className="flex flex-1 flex-col gap-7">
      <Instructions>Pick the word that fits the gap.</Instructions>

      <Prompt>
        {before}
        <span className="mx-1 inline-block min-w-24 border-b-4 border-brand pb-0.5 align-bottom text-brand">
          {choice ?? " "}
        </span>
        {after}
      </Prompt>

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
