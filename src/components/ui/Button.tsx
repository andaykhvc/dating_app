import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-ink hover:bg-brand-strong active:scale-[0.98] disabled:bg-brand/40",
  secondary:
    "bg-raised text-ink border border-line hover:border-brand/40 active:scale-[0.98]",
  ghost: "text-muted hover:text-ink hover:bg-sunken",
  danger: "bg-negative-soft text-negative hover:brightness-95 active:scale-[0.98]",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
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
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold",
        "transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
