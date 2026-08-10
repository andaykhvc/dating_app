import type {
  InputHTMLAttributes,
  ReactNode,
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
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, className)} />;
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
  return (
    <select {...props} className={cn(CONTROL, "appearance-none", className)}>
      {children}
    </select>
  );
}
