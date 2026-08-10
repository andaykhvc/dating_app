import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { GameResult } from "@/features/games/engine/types";
import { cn } from "@/lib/utils";

export function Prompt({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-2xl font-bold leading-snug tracking-tight text-ink">
      {children}
    </p>
  );
}

export function Instructions({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-sm leading-relaxed text-muted">{children}</p>
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
        "w-full rounded-2xl border-2 px-4 py-3.5 text-left text-base font-medium transition-all active:scale-[0.99]",
        state === "correct" && "border-positive bg-positive-soft text-positive",
        state === "wrong" && "border-negative bg-negative-soft text-negative",
        state === "idle" &&
          (selected
            ? "border-brand bg-brand-soft text-brand"
            : "border-line bg-raised text-ink hover:border-brand/40"),
        disabled && state === "idle" && !selected && "opacity-60",
      )}
    >
      {label}
    </button>
  );
}

/** Shared result banner + submit button, so the seven renderers stay small. */
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
  if (result) {
    const positive = result.is_correct !== false;
    return (
      <div className="space-y-3">
        <div
          className={cn(
            "animate-rise rounded-2xl px-4 py-3.5 text-center",
            positive
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
            <p className="mt-1 text-sm">
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
    );
  }

  return (
    <Button
      size="lg"
      fullWidth
      onClick={onSubmit}
      loading={submitting}
      disabled={!canSubmit}
    >
      {submitLabel}
    </Button>
  );
}
