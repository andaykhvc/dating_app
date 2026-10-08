import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { GameResult } from "@/features/games/engine/types";
import { cn } from "@/lib/utils";

export function Prompt({ children }: { children: ReactNode }) {
  return (
    <p className="text-balance text-center text-[clamp(1.25rem,4.5vw,1.875rem)] font-bold leading-snug tracking-tight text-ink [overflow-wrap:anywhere]">
      {children}
    </p>
  );
}

export function Instructions({ children }: { children: ReactNode }) {
  return (
    <p className="text-balance text-center text-sm leading-relaxed text-muted">
      {children}
    </p>
  );
}

/**
 * Short options (single words) sit two to a row even on a small phone; longer
 * ones (whole sentences) get a full row each until there is room for two at a
 * comfortable width. Options change layout rather than shrink their text.
 */
export function ChoiceGrid({
  choices,
  children,
}: {
  choices: string[];
  children: ReactNode;
}) {
  const short = choices.every((c) => c.length <= 14);
  return (
    <div
      className={cn(
        "grid gap-2.5",
        short
          ? "grid-cols-2"
          : "[grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]",
      )}
    >
      {children}
    </div>
  );
}

export function ChoiceButton({
  label,
  selected,
  state,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  state: "idle" | "correct" | "wrong";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "press-soft min-h-14 w-full rounded-[1.125rem] border-2 px-4 py-3 text-left text-base font-medium leading-snug [overflow-wrap:anywhere]",
        state === "correct" && "animate-correct border-positive bg-positive-soft text-positive",
        state === "wrong" && "animate-shake border-negative bg-negative-soft text-negative",
        state === "idle" &&
          (selected
            ? "border-brand bg-brand-soft text-brand"
            : "border-transparent bg-raised text-ink shadow-[var(--shadow-card)] hover:border-brand/30"),
        disabled && state === "idle" && !selected && "opacity-60",
      )}
    >
      {label}
    </button>
  );
}

/**
 * Shared result banner + submit button, so the seven renderers stay small.
 * Pinned to the bottom of the screen, so "Check" is always under a thumb even
 * when a long prompt or a big word pool pushes the content past the fold.
 */
export function GameFooter({
  result,
  onSubmit,
  submitting,
  canSubmit,
  submitLabel = "Check",
  doneLabel = "Done",
  onDone,
}: {
  result: GameResult | null;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
  submitLabel?: string;
  doneLabel?: string;
  onDone: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-gutter mt-auto bg-gradient-to-t from-surface from-70% to-surface/0 px-gutter pb-safe-4 pt-6 md:pb-8">
      {result ? (
        <div className="space-y-3">
          <div
            role="status"
            className={cn(
              "animate-rise rounded-2xl px-4 py-3.5 text-center",
              result.is_correct !== false
                ? "bg-positive-soft text-positive"
                : "bg-negative-soft text-negative",
            )}
          >
            <p className="text-sm font-bold">
              {result.is_correct === true
                ? "Correct"
                : result.is_correct === false
                  ? "Not quite"
                  : "Logged"}
            </p>
            {result.is_correct === false && result.correct_answer && (
              <p className="mt-1 text-sm [overflow-wrap:anywhere]">
                The answer was “{result.correct_answer}”
              </p>
            )}
            {result.xp_awarded > 0 && (
              <p className="mt-1 text-sm font-semibold">
                +{result.xp_awarded} XP
              </p>
            )}
          </div>
          <Button size="lg" fullWidth onClick={onDone}>
            {doneLabel}
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          fullWidth
          onClick={onSubmit}
          loading={submitting}
          disabled={!canSubmit}
        >
          {submitLabel}
        </Button>
      )}
    </div>
  );
}
