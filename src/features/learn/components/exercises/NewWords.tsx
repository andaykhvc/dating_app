"use client";

import { useEffect } from "react";
import { Instruction, SpeakButton, type ExerciseProps } from "./shared";

/** Meet before you are tested: up to four never-seen words with meanings. */
export function NewWords({ exercise, onChange, speech, target, known }: ExerciseProps) {
  const items = exercise.payload.items ?? [];

  useEffect(() => {
    onChange({});
  }, [onChange]);

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1.5">
        <Instruction>New in this lesson</Instruction>
        <p className="text-sm text-muted">
          Tap to hear each one. You&rsquo;ll practise them next.
        </p>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.text}
            className="animate-rise flex items-center gap-3 rounded-2xl border border-line bg-raised p-3.5"
          >
            <SpeakButton text={item.speak} speech={speech} />
            <div className="min-w-0 flex-1">
              <p lang={target.code} className="text-lg font-bold leading-snug text-ink [overflow-wrap:anywhere]">
                {item.text}
              </p>
              <p lang={known.code} className="text-sm text-muted [overflow-wrap:anywhere]">
                {item.translation}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
