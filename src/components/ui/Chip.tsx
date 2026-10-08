import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "accent" | "positive";
  className?: string;
}) {
  const tones = {
    neutral: "bg-sunken text-muted",
    brand: "bg-brand-soft text-brand",
    accent: "bg-accent-soft text-accent-ink",
    positive: "bg-positive-soft text-positive",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SelectableChip({
  children,
  selected,
  onClick,
  disabled,
}: {
  children: ReactNode;
  selected: boolean;
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
        "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-all",
        "active:scale-[0.97] disabled:opacity-40",
        selected
          ? "border-brand bg-brand text-brand-ink"
          : "border-line bg-raised text-muted hover:border-brand/40",
      )}
    >
      {children}
    </button>
  );
}
