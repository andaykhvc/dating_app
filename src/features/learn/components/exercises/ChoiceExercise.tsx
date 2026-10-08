"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Instruction,
  OptionButton,
  PromptText,
  SpeakButton,
  optionState,
  type ExerciseProps,
} from "./shared";

/**
 * The six multiple-choice mechanics share one renderer; they differ only in
 * what is asked (a word, a meaning, a sound, a sentence, a situation, a gap)
 * and in which language the options are written.
 */
export function ChoiceExercise({ exercise, result, onChange, speech, target, known }: ExerciseProps) {
  const { type, payload } = exercise;
  const choices = useMemo(() => payload.choices ?? [], [payload.choices]);
  const [selected, setSelected] = useState<string | null>(null);
  const correct = result?.expected?.choice;

  // Listening starts with the sound, like being spoken to.
  useEffect(() => {
    if (type === "listen_choice" && payload.speak) speech.speak(payload.speak);
    // Only on first show of this exercise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Number keys pick an option on a keyboard.
  useEffect(() => {
    if (result) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= choices.length) {
        setSelected(choices[n - 1]);
        onChange({ choice: choices[n - 1] });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choices, onChange, result]);

  const optionLang =
    type === "vocab_choice" || type === "sentence_choice" ? known.code : target.code;
  const long = choices.some((c) => c.length > 18);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="space-y-3">
        <Instruction>
          {type === "vocab_choice" && "What does this mean?"}
          {type === "vocab_recall" && `How do you say this in ${target.name}?`}
          {type === "listen_choice" && "Listen, then pick what you heard"}
          {type === "sentence_choice" && "Pick the right translation"}
          {type === "context_choice" && "What would you say?"}
          {type === "missing_word" && "Fill the gap"}
        </Instruction>

        {type === "listen_choice" && (
          <div className="flex items-center gap-3 py-2">
            {speech.canSpeak ? (
              <>
                <SpeakButton text={payload.speak ?? ""} speech={speech} size="lg" label="Play again" />
                <SpeakButton text={payload.speak ?? ""} speech={speech} slow />
              </>
            ) : (
              <p className="rounded-[1rem] bg-fill px-4 py-3 text-sm text-muted">
                No {target.name} voice on this device. Use &ldquo;Can&rsquo;t listen now&rdquo; below.
              </p>
            )}
          </div>
        )}

        {(type === "vocab_choice" || type === "sentence_choice") && (
          <div className="flex items-start gap-3">
            <SpeakButton text={payload.speak ?? payload.prompt ?? ""} speech={speech} />
            <PromptText lang={payload.prompt_lang} size={type === "sentence_choice" ? "md" : "lg"}>
              {payload.prompt}
            </PromptText>
          </div>
        )}

        {type === "vocab_recall" && (
          <PromptText lang={payload.prompt_lang}>{payload.prompt}</PromptText>
        )}

        {type === "context_choice" && (
          <div className="rounded-[1rem] bg-fill px-4 py-3.5">
            <p className="text-base leading-relaxed text-ink">{payload.situation}</p>
          </div>
        )}

        {type === "missing_word" && (
          <div className="space-y-2">
            <PromptText lang={target.code} size="md">
              {payload.before}{" "}
              <span
                className={cn(
                  "inline-block min-w-12 border-b-[3px] text-center align-baseline transition-colors",
                  !result && (selected ? "border-brand text-brand" : "border-line text-transparent"),
                  result?.correct === true && "border-positive text-positive",
                  result?.correct === false && "border-negative text-negative",
                )}
              >
                {(result ? correct : selected) ?? " "}
              </span>
              {payload.after?.match(/^[.,!?…:;]/) ? "" : " "}
              {payload.after}
            </PromptText>
            {payload.hint && (
              <p lang={payload.hint_lang} className="text-sm text-muted">
                {payload.hint}
              </p>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          "grid gap-2.5",
          long ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2",
        )}
      >
        {choices.map((option, i) => (
          <OptionButton
            key={option}
            lang={optionLang}
            hotkey={i + 1}
            state={optionState(option, selected, result, correct)}
            disabled={result !== null}
            onClick={() => {
              setSelected(option);
              onChange({ choice: option });
              if (type !== "vocab_choice" && type !== "sentence_choice" && option.length < 60) {
                // Hearing the option you tap is how the listening sticks.
                if (type !== "listen_choice") speech.speak(option);
              }
            }}
          >
            {option}
          </OptionButton>
        ))}
      </div>
    </div>
  );
}
