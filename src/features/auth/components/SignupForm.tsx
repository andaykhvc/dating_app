"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { createClient } from "@/lib/supabase/client";
import { isAtLeast18, maxDateOfBirth } from "@/lib/date";

export function SignupForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed18, setConfirmed18] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (firstName.trim().length < 2) {
      setError("Please enter your first name.");
      return;
    }
    if (!dob || !isAtLeast18(dob)) {
      setError("You must be 18 or older to use Lingua Match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (!confirmed18) {
      setError("Please confirm you are 18 or older.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // first_name and the 18+ confirmation ride along in user metadata so the
    // handle_new_user trigger can seed the profile row immediately.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName.trim(), is_18_plus_confirmed: true },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // With email confirmation on there is no session yet; the date of birth is
    // captured again on the first onboarding step.
    if (!data.session) {
      router.push("/verify-email");
      return;
    }

    await supabase
      .from("profiles")
      .update({ date_of_birth: dob })
      .eq("id", data.user!.id);

    router.push("/onboarding/basics");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted">
          Takes about two minutes. You can change everything later.
        </p>
      </div>

      <Field label="First name">
        <Input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Sofia"
          autoComplete="given-name"
          maxLength={40}
          required
        />
      </Field>

      <Field label="Date of birth" hint="Lingua Match is 18+. Only your age is ever shown.">
        <Input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          max={maxDateOfBirth()}
          required
        />
      </Field>

      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </Field>

      <Field label="Password" hint="At least 8 characters.">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <label className="flex items-start gap-3 rounded-2xl bg-sunken p-4">
        <input
          type="checkbox"
          checked={confirmed18}
          onChange={(e) => setConfirmed18(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--brand)]"
        />
        <span className="text-sm text-muted">
          I confirm I am 18 years or older.
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={loading}>
        Create account
      </Button>

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">or continue with</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <OAuthButtons />

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Sign in
        </Link>
      </p>
    </form>
  );
}
