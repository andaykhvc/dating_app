"use client";

import { useMemo, useState } from "react";
import { GameFooter, Instructions } from "./shared";
import type { TemplateProps, WordOrderPayload } from "@/features/games/engine/types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function WordOrder({
  session,
  onSubmit,
  result,
  submitting,
  onDone,
}: TemplateProps & { onDone: () => void }) {
  const payload = session.content?.payload as unknown as WordOrderPayload;

  // Indices, not strings — a sentence can legitimately repeat a word.
  const pool = useMemo(
    () => shuffle((payload?.tokens ?? []).map((_, i) => i)),
    [payload?.tokens],
  );
  const [picked, setPicked] = useState<number[]>([]);

  const remaining = pool.filter((i) => !picked.includes(i));
  const sentence = picked.map((i) => payload.tokens[i]).join(" ");

  return (
    <div className="flex flex-1 flex-col gap-7">
      <Instructions>Tap the words to build the sentence.</Instructions>

      <div className="min-h-24 rounded-2xl border-2 border-dashed border-line bg-raised p-4">
        {picked.length === 0 ? (
          <p className="text-center text-sm text-faint">Your sentence appears here</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {picked.map((tokenIndex, position) => (
              <button
                key={`${tokenIndex}-${position}`}
                type="button"
                onClick={() =>
                  !result &&
                  setPicked((prev) => prev.filter((_, p) => p !== position))
                }
                disabled={result !== null}
                className="rounded-xl bg-brand px-3 py-2 text-sm font-medium text-brand-ink"
              >
                {payload.tokens[tokenIndex]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {remaining.map((tokenIndex) => (
          <button
            key={tokenIndex}
            type="button"
            onClick={() => setPicked((prev) => [...prev, tokenIndex])}
            disabled={result !== null}
            className="rounded-xl border border-line bg-raised px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand/40 disabled:opacity-50"
          >
            {payload.tokens[tokenIndex]}
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <GameFooter
          result={result}
          submitting={submitting}
          canSubmit={remaining.length === 0}
          onSubmit={() => onSubmit({ answer: sentence })}
          onDone={onDone}
        />
      </div>
    </div>
  );
}
