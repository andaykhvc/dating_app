import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-2xl border border-line bg-raised px-4 py-3 text-base text-ink " +
  "placeholder:text-faint outline-none transition-colors " +
  "focus:border-brand focus:ring-2 focus:ring-brand/20";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-negative">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-faint">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input {...props} ref={ref} className={cn(CONTROL, className)} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={cn(CONTROL, "resize-none", className)} />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  // appearance-none drops the platform arrow, so draw one back — otherwise a
  // select reads as a plain text box.
  return (
    <span className="relative block">
      <select {...props} className={cn(CONTROL, "appearance-none pr-11", className)}>
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-faint"
      >
        <path
          d="m6 9 6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
