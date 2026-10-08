"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { BackIcon, LogoMark } from "@/components/icons";
import { ONBOARDING_STEPS, stepIndex } from "@/features/onboarding/steps";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Phones: a progress bar pinned to the top and the Continue button pinned to
 * the bottom, where a thumb is — above the keyboard on Android, since the
 * viewport resizes for it.
 *
 * Desktop: the whole journey as a step list on the left and the current step
 * as a card beside it, so a short form is not a lonely column on a big screen.
 */
export function StepShell({
  title,
  subtitle,
  children,
  onContinue,
  continueLabel = "Continue",
  canContinue = true,
  loading = false,
  error,
  optional,
  onSkip,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onContinue: () => void;
  continueLabel?: string;
  canContinue?: boolean;
  loading?: boolean;
  error?: string | null;
  optional?: boolean;
  onSkip?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const index = stepIndex(pathname);
  const steps = ONBOARDING_STEPS.slice(0, -1);
  const total = steps.length;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-gutter lg:grid lg:max-w-5xl lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-12 lg:py-12 xl:gap-16">
      <aside className="hidden lg:sticky lg:top-12 lg:block">
        <Link href="/" className="flex items-center gap-2.5 text-brand">
          <LogoMark className="size-8" />
          <span className="font-bold tracking-tight text-ink">{APP_NAME}</span>
        </Link>
        <p className="mb-3 mt-10 text-xs font-semibold uppercase tracking-wide text-faint">
          Set up your profile
        </p>
        <ol className="space-y-1">
          {steps.map((step, i) => {
            const done = i < index;
            const current = i === index;
            return (
              <li
                key={step.path}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm",
                  current ? "bg-brand-soft font-semibold text-brand" : done ? "text-ink" : "text-faint",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    done
                      ? "bg-brand text-brand-ink"
                      : current
                        ? "border-2 border-brand"
                        : "border border-line",
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                {step.label}
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="flex flex-1 flex-col lg:rounded-[var(--radius-card)] lg:border lg:border-line lg:bg-raised lg:p-10 lg:shadow-[0_18px_50px_-30px_rgba(0,0,0,0.25)] xl:p-12">
        <div className="sticky top-0 z-10 -mx-gutter bg-surface/90 px-gutter pb-3 pt-safe-3 backdrop-blur-lg lg:hidden">
          <div className="flex min-h-11 items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunken"
              >
                <BackIcon className="size-5" />
              </button>
            )}
            <div
              className="flex flex-1 gap-1.5"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={index + 1}
              aria-label={`Step ${index + 1} of ${total}`}
            >
              {steps.map((step, i) => (
                <span
                  key={step.path}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= index ? "bg-brand" : "bg-line",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 pt-5 short:pt-3 lg:pt-0">
          <p className="mb-2 text-xs font-semibold text-brand">
            Step {index + 1} of {total}
          </p>
          <h1 className="text-[clamp(1.625rem,6vw,2.25rem)] font-bold leading-tight tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-muted md:text-[0.9375rem]">
              {subtitle}
            </p>
          )}
          <div className="mt-6 short:mt-5 lg:mt-8">{children}</div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative"
          >
            {error}
          </p>
        )}

        <div className="sticky bottom-0 -mx-gutter space-y-2 bg-gradient-to-t from-surface via-surface to-transparent px-gutter pb-safe-3 pt-6 lg:static lg:mx-0 lg:flex lg:flex-row-reverse lg:items-center lg:gap-3 lg:space-y-0 lg:bg-none lg:px-0 lg:pb-0 lg:pt-10">
          <Button
            size="lg"
            fullWidth
            className="lg:w-auto lg:min-w-44"
            onClick={onContinue}
            disabled={!canContinue}
            loading={loading}
          >
            {continueLabel}
          </Button>
          {optional && onSkip && (
            <Button
              variant="ghost"
              fullWidth
              className="lg:w-auto"
              onClick={onSkip}
              disabled={loading}
            >
              Skip for now
            </Button>
          )}
          {/* Phones have the back arrow in the sticky header instead. */}
          {index > 0 && (
            <div className="hidden lg:mr-auto lg:block">
              <Button variant="ghost" onClick={() => router.back()}>
                <BackIcon className="size-4" /> Back
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
