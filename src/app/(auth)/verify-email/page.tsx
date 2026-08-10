import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confirm your email" };

export default function VerifyEmailPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        Check your inbox
      </h1>
      <p className="text-sm leading-relaxed text-muted">
        We sent you a confirmation link. Open it on this device and you will land
        straight in onboarding.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Nothing arrived? Check spam, or wait a minute and try signing in — some
        projects have email confirmation switched off, in which case you can go
        straight through.
      </p>
      <Link
        href="/login"
        className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-raised px-6 text-sm font-semibold text-ink"
      >
        Go to sign in
      </Link>
    </div>
  );
}
