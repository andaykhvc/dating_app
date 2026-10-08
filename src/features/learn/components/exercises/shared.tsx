"use client";

import type { ReactNode } from "react";
import { SpeakerIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type {
  Exercise,
  ExerciseAnswer,
  ExerciseResult,
  LanguageInfo,
} from "@/features/learn/types";

export type Speech = {
  canSpeak: boolean;
  speak: (text: string, slow?: boolean) => boolean;
};

/** Props every exercise renderer receives from the lesson player. */
export type ExerciseProps = {
  exercise: Exercise;
  result: ExerciseResult | null;
  /** Report the learner's current answer, or null while it is incomplete. */
  onChange: (answer: ExerciseAnswer | null) => void;
  /** Enter in a text field. */
  onSubmit: () => void;
  speech: Speech;
  target: LanguageInfo;
  known: LanguageInfo;
};

export function Instruction({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-faint">
      {children}
    </p>
  );
}

/** The thing being asked about: a word, a sentence, a situation. */
export function PromptText({
  children,
  lang,
  size = "lg",
}: {
  children: ReactNode;
  lang?: string;
  size?: "lg" | "md";
}) {
  return (
    <p
      lang={lang}
      className={cn(
        "font-bold leading-snug tracking-tight text-ink [overflow-wrap:anywhere]",
        size === "lg"
          ? "text-[clamp(1.5rem,5.5vw,2.25rem)]"
          : "text-[clamp(1.125rem,4vw,1.5rem)]",
      )}
    >
      {children}
    </p>
  );
}

export function SpeakButton({
  text,
  speech,
  size = "md",
  slow = false,
  label,
}: {
  text: string;
  speech: Speech;
  size?: "md" | "lg";
  slow?: boolean;
  label?: string;
}) {
  if (!speech.canSpeak) return null;
  return (
    <button
      type="button"
      onClick={() => speech.speak(text, slow)}
      aria-label={label ?? (slow ? "Play slowly" : "Play")}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-[transform,background-color] active:scale-95",
        size === "lg"
          ? "size-20 bg-brand text-brand-ink shadow-lg shadow-brand/25 hover:bg-brand-strong"
          : "size-11 bg-brand-soft text-brand hover:bg-brand/15",
        slow && size !== "lg" && "bg-sunken text-muted",
      )}
    >
      <SpeakerIcon className={size === "lg" ? "size-9" : "size-5"} />
      {slow && <span className="sr-only">slowly</span>}
    </button>
  );
}

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

export function OptionButton({
  children,
  state,
  onClick,
  disabled,
  lang,
  hotkey,
}: {
  children: ReactNode;
  state: OptionState;
  onClick: () => void;
  disabled?: boolean;
  lang?: string;
  hotkey?: number;
}) {
  return (
    <button
      type="button"
      lang={lang}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === "selected"}
      className={cn(
        "group flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base font-medium leading-snug transition-[transform,background-color,border-color,opacity] [overflow-wrap:anywhere] active:scale-[0.99]",
        state === "idle" && "border-line bg-raised text-ink hover:border-brand/40",
        state === "selected" && "border-brand bg-brand-soft text-brand",
        state === "correct" && "border-positive bg-positive-soft text-positive",
        state === "wrong" && "border-negative bg-negative-soft text-negative",
        state === "dimmed" && "border-line bg-raised text-faint opacity-60",
      )}
    >
      {hotkey !== undefined && (
        <kbd className="hidden size-6 shrink-0 items-center justify-center rounded-md border border-current/25 text-xs font-semibold opacity-60 md:flex">
          {hotkey}
        </kbd>
      )}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export function optionState(
  option: string,
  selected: string | null,
  result: ExerciseResult | null,
  correct: string | undefined,
): OptionState {
  if (!result) return option === selected ? "selected" : "idle";
  if (option === correct) return "correct";
  if (option === selected) return "wrong";
  return "dimmed";
}
