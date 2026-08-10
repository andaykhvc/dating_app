"use client";

import { INTENTION_DESCRIPTIONS, INTENTION_LABELS } from "@/lib/constants";
import { INTENTIONS, type Intention } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Dating sits at the bottom, visually separated, and off by default. The
 * product is a language exchange that permits dating — not the reverse — and
 * the interface should say so before any copy does.
 */
export function IntentionPicker({
  value,
  onChange,
}: {
  value: Intention[];
  onChange: (next: Intention[]) => void;
}) {
  function toggle(intention: Intention) {
    onChange(
      value.includes(intention)
        ? value.filter((i) => i !== intention)
        : [...value, intention],
    );
  }

  return (
    <div className="space-y-2.5">
      {INTENTIONS.map((intention) => {
        const selected = value.includes(intention);
        const isDating = intention === "open_to_dating";

        return (
          <button
            key={intention}
            type="button"
            onClick={() => toggle(intention)}
            aria-pressed={selected}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.99]",
              isDating && "mt-5",
              selected
                ? isDating
                  ? "border-accent bg-accent-soft"
                  : "border-brand bg-brand-soft"
                : "border-line bg-raised hover:border-brand/40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                selected
                  ? isDating
                    ? "border-accent bg-accent text-white"
                    : "border-brand bg-brand text-brand-ink"
                  : "border-line",
              )}
            >
              {selected && (
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-sm font-semibold",
                  selected && isDating ? "text-accent" : "text-ink",
                )}
              >
                {INTENTION_LABELS[intention]}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                {INTENTION_DESCRIPTIONS[intention]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
