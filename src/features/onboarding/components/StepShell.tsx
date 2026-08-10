"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { BackIcon } from "@/components/icons";
import { ONBOARDING_STEPS, stepIndex } from "@/features/onboarding/steps";

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
  const total = ONBOARDING_STEPS.length - 1;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8">
      <div className="safe-top sticky top-0 z-10 -mx-6 bg-surface/90 px-6 pb-3 pt-4 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          {index > 0 && (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="-ml-2 rounded-full p-2 text-muted hover:bg-sunken"
            >
              <BackIcon className="size-5" />
            </button>
          )}
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= index ? "bg-brand" : "bg-line"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 pt-6">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
        )}
        <div className="mt-7">{children}</div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative"
        >
          {error}
        </p>
      )}

      <div className="safe-bottom sticky bottom-0 space-y-2 bg-gradient-to-t from-surface via-surface to-transparent pb-2 pt-6">
        <Button
          size="lg"
          fullWidth
          onClick={onContinue}
          disabled={!canContinue}
          loading={loading}
        >
          {continueLabel}
        </Button>
        {optional && onSkip && (
          <Button variant="ghost" fullWidth onClick={onSkip} disabled={loading}>
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}
