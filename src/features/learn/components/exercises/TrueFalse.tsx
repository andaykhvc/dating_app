"use client";

import { useState } from "react";
import { Instruction, OptionButton, PromptText, SpeakButton, type ExerciseProps } from "./shared";

export function TrueFalse({ exercise, result, onChange, speech }: ExerciseProps) {
  const { payload } = exercise;
  const [value, setValue] = useState<boolean | null>(null);
  const expected = result?.expected?.value;

  const state = (option: boolean) => {
    if (!result) return value === option ? "selected" : "idle";
    if (option === expected) return "correct";
    if (option === value) return "wrong";
    return "dimmed";
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="space-y-4">
        <Instruction>Does it mean this?</Instruction>
        <div className="flex items-start gap-3">
          <SpeakButton text={payload.speak ?? payload.prompt ?? ""} speech={speech} />
          <PromptText lang={payload.prompt_lang} size="md">
            {payload.prompt}
          </PromptText>
        </div>
        <div className="rounded-[1rem] bg-fill px-4 py-3.5">
          <p lang={payload.statement_lang} className="text-base leading-relaxed text-ink">
            {payload.statement}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[true, false].map((option) => (
          <OptionButton
            key={String(option)}
            state={state(option)}
            disabled={result !== null}
            hotkey={option ? 1 : 2}
            onClick={() => {
              setValue(option);
              onChange({ value: option });
            }}
          >
            {option ? "Yes, it does" : "No, it doesn’t"}
          </OptionButton>
        ))}
      </div>
    </div>
  );
}
