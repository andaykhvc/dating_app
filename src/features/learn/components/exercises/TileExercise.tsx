"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Instruction, PromptText, type ExerciseProps } from "./shared";

const TILE =
  "min-h-11 max-w-full rounded-xl px-3.5 py-2 text-base font-medium leading-snug [overflow-wrap:anywhere] transition-[transform,colors] active:scale-95";

/**
 * Word order (every tile is used) and translate-with-tiles (some tiles are
 * decoys). Tiles are tracked by index: a sentence can repeat a word ("la").
 * The server already shuffled them.
 */
export function TileExercise({ exercise, result, onChange, target }: ExerciseProps) {
  const tiles = exercise.payload.tiles ?? [];
  const [picked, setPicked] = useState<number[]>([]);
  const decoys = exercise.type === "word_bank";

  function set(next: number[]) {
    setPicked(next);
    const complete = decoys ? next.length > 0 : next.length === tiles.length;
    onChange(complete ? { tokens: next.map((i) => tiles[i]) } : null);
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="space-y-3">
        <Instruction>
          {decoys ? `Translate into ${target.name}` : "Put the words in order"}
        </Instruction>
        <PromptText lang={exercise.payload.hint_lang} size="md">
          {exercise.payload.hint}
        </PromptText>
      </div>

      <div
        aria-live="polite"
        lang={target.code}
        className={cn(
          "min-h-28 rounded-2xl border-2 border-dashed p-3 transition-colors sm:p-4",
          !result && "border-line bg-raised",
          result?.correct === true && "border-positive bg-positive-soft",
          result?.correct === false && "border-negative bg-negative-soft",
        )}
      >
        {picked.length === 0 ? (
          <p className="flex min-h-20 items-center justify-center text-center text-sm text-faint">
            Tap the words below
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {picked.map((tileIndex, position) => (
              <button
                key={`${tileIndex}-${position}`}
                type="button"
                disabled={result !== null}
                onClick={() => set(picked.filter((_, p) => p !== position))}
                aria-label={`Remove “${tiles[tileIndex]}”`}
                className={cn(TILE, "bg-brand text-brand-ink disabled:opacity-90")}
              >
                {tiles[tileIndex]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2" lang={target.code}>
        {tiles.map((tile, i) => {
          const used = picked.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={used || result !== null}
              onClick={() => set([...picked, i])}
              className={cn(
                TILE,
                "border border-transparent bg-raised text-ink shadow-[var(--shadow-card)] hover:border-brand/30",
                used && "border-dashed bg-sunken text-transparent",
                result && !used && "opacity-50",
              )}
            >
              {tile}
            </button>
          );
        })}
      </div>
    </div>
  );
}
