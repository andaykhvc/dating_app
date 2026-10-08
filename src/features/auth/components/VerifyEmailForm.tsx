"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import {
  forgetPendingEmail,
  readPendingEmail,
  rememberPendingEmail,
} from "@/features/auth/pendingEmail";
import { createClient } from "@/lib/supabase/client";
import {
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
  isCompleteOtp,
  normalizeOtp,
  otpErrorMessage,
  secondsLeft,
} from "@/lib/otp";

/**
 * Finishes sign-up with the six-digit code from the email, typed into the page
 * the person is already on. A link would open in the mail app's own browser and
 * lose the session; a code does not.
 */
export function VerifyEmailForm() {
  const router = useRouter();
  // Read after mount: sessionStorage does not exist on the server.
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendUntil, setResendUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // A one-time read of browser-only storage on mount; no effect-free way.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail(readPendingEmail());
  }, []);

  const wait = secondsLeft(resendUntil, now);
  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [wait]);

  async function verify(value: string) {
    if (busy || !email || !isCompleteOtp(value)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: verifyError } = await createClient().auth.verifyOtp({
      email: email.trim(),
      token: value,
      type: "signup",
    });
    if (verifyError) {
      setError(otpErrorMessage(verifyError.message));
      setBusy(false);
      codeRef.current?.focus();
      return;
    }
    forgetPendingEmail();
    router.push("/onboarding/basics");
    router.refresh();
  }

  function onCodeChange(raw: string) {
    const next = normalizeOtp(raw);
    setCode(next);
    setError(null);
    // The sixth digit (typed, pasted or autofilled) submits by itself.
    if (isCompleteOtp(next)) void verify(next);
  }

  async function resend() {
    if (resending || wait > 0 || !email.trim()) return;
    setResending(true);
    setError(null);
    setNotice(null);
    const { error: resendError } = await createClient().auth.resend({
      type: "signup",
      email: email.trim(),
    });
    setResending(false);
    if (resendError) {
      setError(otpErrorMessage(resendError.message));
      // Whatever the reason, do not let the button be hammered.
      setNow(Date.now());
      setResendUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      return;
    }
    rememberPendingEmail(email.trim());
    setCode("");
    setNow(Date.now());
    setResendUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
    setNotice("A new code is on its way. The old one no longer works.");
    codeRef.current?.focus();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void verify(code);
      }}
      className="space-y-5"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Enter your code</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {email ? (
            <>
              We sent a {OTP_LENGTH}-digit code to <strong className="text-ink">{email}</strong>.
              It can take a minute. Check spam too.
            </>
          ) : (
            <>Enter the email address you signed up with and the {OTP_LENGTH}-digit code we sent to it.</>
          )}
        </p>
      </div>

      {!email && (
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
      )}

      <Field label="Code" error={error}>
        <Input
          ref={codeRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={OTP_LENGTH + 4}
          placeholder="123456"
          aria-label={`${OTP_LENGTH}-digit code`}
          autoFocus
          className="text-center text-2xl font-semibold tracking-[0.4em]"
        />
      </Field>

      {notice && (
        <p role="status" className="rounded-2xl bg-positive-soft px-4 py-3 text-sm text-positive">
          {notice}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={busy} disabled={!isCompleteOtp(code) || !email}>
        Verify and continue
      </Button>

      <div className="space-y-2 text-center text-sm text-muted">
        <button
          type="button"
          onClick={resend}
          disabled={resending || wait > 0 || !email.trim()}
          className="font-semibold text-brand disabled:text-faint"
        >
          {wait > 0 ? `Send a new code in ${wait}s` : resending ? "Sending…" : "Send a new code"}
        </button>
        <p>
          Wrong address?{" "}
          <Link href="/signup" className="font-semibold text-brand">
            Start again
          </Link>{" "}
          · Already confirmed?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
