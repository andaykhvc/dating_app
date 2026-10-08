"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { createClient } from "@/lib/supabase/client";
import { rememberPendingEmail } from "@/features/auth/pendingEmail";
import { isEmailNotConfirmed } from "@/lib/otp";
import { safeNextPath } from "@/lib/redirect";

const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback_failed: "That didn't work — please try again.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // "" when absent or not a plain same-site path.
  const next = safeNextPath(searchParams.get("next"), "");
  const callbackError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    callbackError ? (CALLBACK_ERRORS[callbackError] ?? "Something went wrong — please try again.") : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Signed up but never entered the code: send a fresh one and go to the
      // code screen instead of showing a bare "Email not confirmed".
      if (isEmailNotConfirmed(signInError.message)) {
        await supabase.auth.resend({ type: "signup", email: email.trim() });
        rememberPendingEmail(email.trim());
        router.push("/verify-email");
        return;
      }
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(next || "/discover");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your streak is waiting.
        </p>
      </div>

      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </Field>

      <Field label="Password">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>

      {error && (
        <p role="alert" className="rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={loading}>
        Sign in
      </Button>

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">or continue with</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <OAuthButtons next={next || undefined} />

      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand">
          Create an account
        </Link>
      </p>
    </form>
  );
}
