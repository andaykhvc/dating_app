import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// A filled field, iOS-style: no outline at rest, the fill itself is the
// affordance. Focus lifts it onto a raised surface with a brand ring.
const CONTROL =
  "w-full rounded-[0.875rem] border border-transparent bg-fill px-4 py-3 text-base text-ink " +
  "placeholder:text-faint outline-none transition-[background-color,box-shadow,border-color] duration-200 ease-ios " +
  "hover:bg-fill-strong focus:border-brand/50 focus:bg-raised focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_18%,transparent)] " +
  "focus-visible:outline-none aria-[invalid=true]:border-negative/60";

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
      <span className="mb-1.5 block px-1 text-[0.8125rem] font-semibold text-muted">{label}</span>
      {children}
      {error ? (
        <span className="animate-fade mt-1.5 block px-1 text-xs text-negative">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block px-1 text-xs text-faint">{hint}</span>
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
