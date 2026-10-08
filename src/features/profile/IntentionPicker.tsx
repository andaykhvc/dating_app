"use client";

import { Fragment } from "react";
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
  datingConsent,
  onDatingConsentChange,
}: {
  value: Intention[];
  onChange: (next: Intention[]) => void;
  /** Explicit consent to be shown as open to dating; required while selected. */
  datingConsent: boolean;
  onDatingConsentChange: (consent: boolean) => void;
}) {
  function toggle(intention: Intention) {
    const removing = value.includes(intention);
    onChange(removing ? value.filter((i) => i !== intention) : [...value, intention]);
    // Consent belongs to the choice: unselecting dating withdraws it, and
    // selecting it again starts from an unticked box.
    if (intention === "open_to_dating") onDatingConsentChange(false);
  }

  return (
    <div className="space-y-2.5">
      {INTENTIONS.map((intention) => {
        const selected = value.includes(intention);
        const isDating = intention === "open_to_dating";

        return (
          <Fragment key={intention}>
          <button
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
          {isDating && selected && (
            <label className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-4">
              <input
                type="checkbox"
                checked={datingConsent}
                onChange={(e) => onDatingConsentChange(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="text-xs leading-relaxed text-ink">
                <span className="block text-sm font-semibold">Your consent</span>
                I consent to Lingua Match showing that I am open to dating on my profile to other
                members, and to using this choice to decide who sees my profile. This is sensitive
                information about my personal life. I can withdraw my consent at any time by
                unselecting this option, and doing so does not affect anything done before.
              </span>
            </label>
          )}
          </Fragment>
        );
      })}
    </div>
  );
}
