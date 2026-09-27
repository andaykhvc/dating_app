"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Instruction, PromptText, SpeakButton, type ExerciseProps } from "./shared";

/**
 * Letters a learner's keyboard may not have. Tapping one inserts it at the
 * cursor. Answers are also accepted without accents (with a gentle note), so
 * this is a convenience, not a requirement.
 */
const SPECIAL: Record<string, string[]> = {
  de: ["ä", "ö", "ü", "ß"],
  es: ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"],
  nl: ["é", "ë", "ï", "ó", "ü"],
  tr: ["ç", "ğ", "ı", "İ", "ö", "ş", "ü"],
  fr: ["à", "â", "ç", "é", "è", "ê", "ë", "î", "ô", "ù", "û"],
};

export function TypeExercise({ exercise, result, onChange, onSubmit, speech, target }: ExerciseProps) {
  const { type, payload } = exercise;
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (type === "listen_type" && payload.speak) speech.speak(payload.speak);
    inputRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(next: string) {
    const clipped = next.slice(0, 200);
    setValue(clipped);
    onChange(clipped.trim() ? { text: clipped } : null);
  }

  function insert(ch: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    update(value.slice(0, start) + ch + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + ch.length, start + ch.length);
    });
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="space-y-3">
        <Instruction>
          {type === "listen_type" ? "Type what you hear" : `Write this in ${target.name}`}
        </Instruction>
        {type === "listen_type" ? (
          <div className="flex items-center gap-3 py-2">
            {speech.canSpeak ? (
              <>
                <SpeakButton text={payload.speak ?? ""} speech={speech} size="lg" label="Play again" />
                <SpeakButton text={payload.speak ?? ""} speech={speech} slow />
              </>
            ) : (
              <p className="rounded-2xl bg-sunken px-4 py-3 text-sm text-muted">
                No {target.name} voice on this device. Use &ldquo;Can&rsquo;t listen now&rdquo; below.
              </p>
            )}
          </div>
        ) : (
          <PromptText lang={payload.prompt_lang}>{payload.prompt}</PromptText>
        )}
      </div>

      <div className="space-y-2.5">
        {/* 16px text keeps iOS from zooming in on focus. */}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSubmit();
            }
          }}
          disabled={result !== null}
          lang={target.code}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label={`Your answer in ${target.name}`}
          placeholder={`Type in ${target.name}…`}
          className={cn(
            "h-14 w-full rounded-2xl border-2 bg-raised px-4 text-base text-ink outline-none transition-colors placeholder:text-faint",
            !result && "border-line focus:border-brand",
            result?.correct === true && "border-positive bg-positive-soft",
            result?.correct === false && "border-negative bg-negative-soft",
            result && result.correct === null && "border-line",
          )}
        />
        {!result && SPECIAL[target.code] && (
          <div className="flex flex-wrap gap-1.5" aria-label="Special characters">
            {SPECIAL[target.code].map((ch) => (
              <button
                key={ch}
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => insert(ch)}
                className="min-h-10 min-w-10 rounded-xl border border-line bg-raised px-2 text-base font-medium text-ink hover:border-brand/40 active:scale-95"
              >
                {ch}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
