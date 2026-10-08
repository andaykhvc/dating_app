"use client";

import { useMemo, useState } from "react";
import { GameFooter, Instructions } from "./shared";
import type { TemplateProps, WordOrderPayload } from "@/features/games/engine/types";

/**
 * Seeded by the session id rather than Math.random(): the server and the
 * browser both render this, and a different order on each side was a hydration
 * mismatch. It also keeps the order stable across a refresh of the same round.
 */
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const random = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };

  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const TOKEN =
  "min-h-11 max-w-full rounded-xl px-3.5 py-2 text-base font-medium leading-snug [overflow-wrap:anywhere] transition-[transform,colors] active:scale-95";

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
    () =>
      seededShuffle(
        (payload?.tokens ?? []).map((_, i) => i),
        session.session_id,
      ),
    [payload?.tokens, session.session_id],
  );
  const [picked, setPicked] = useState<number[]>([]);

  const remaining = pool.filter((i) => !picked.includes(i));
  const sentence = picked.map((i) => payload.tokens[i]).join(" ");

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8">
      <Instructions>Tap the words to build the sentence.</Instructions>

      <div
        aria-live="polite"
        className="min-h-28 rounded-2xl border-2 border-dashed border-line bg-raised p-3 sm:p-4"
      >
        {picked.length === 0 ? (
          <p className="flex min-h-20 items-center justify-center text-center text-sm text-faint">
            Your sentence appears here
          </p>
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
                aria-label={`Remove “${payload.tokens[tokenIndex]}”`}
                className={`${TOKEN} bg-brand text-brand-ink`}
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
            className={`${TOKEN} border border-transparent bg-raised text-ink shadow-[var(--shadow-card)] hover:border-brand/30 disabled:opacity-50`}
          >
            {payload.tokens[tokenIndex]}
          </button>
        ))}
      </div>

      <GameFooter
        result={result}
        submitting={submitting}
        canSubmit={remaining.length === 0}
        onSubmit={() => onSubmit({ answer: sentence })}
        onDone={onDone}
      />
    </div>
  );
}
