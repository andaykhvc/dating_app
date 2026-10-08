import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "tinted" | "ghost" | "danger";
type Size = "md" | "lg";

/*
 * iOS button styles: filled for the one action a screen is about, a quiet grey
 * fill for the alternatives, tinted for a secondary action that should still
 * read as the brand, and plain for the least important. No outlines — weight
 * comes from fill, not from a border.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_6px_16px_-8px_var(--brand)] hover:bg-brand-strong disabled:bg-brand/40 disabled:shadow-none",
  secondary: "bg-fill text-ink hover:bg-fill-strong",
  tinted: "bg-brand-soft text-brand hover:bg-brand/15",
  ghost: "text-muted hover:bg-fill hover:text-ink",
  danger: "bg-negative-soft text-negative hover:brightness-95",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-14 px-6 text-base",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "press inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em]",
        "disabled:cursor-not-allowed disabled:opacity-55",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/** The iOS activity indicator: a ring with a gap, turning. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80",
        className,
      )}
    />
  );
}
