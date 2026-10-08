"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { createClient } from "@/lib/supabase/client";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal-consent";
import { PrivacyLink, TermsLink } from "@/features/legal/LegalLinks";
import { authCallbackUrl } from "@/lib/site";
import { rememberPendingEmail } from "@/features/auth/pendingEmail";
import { isAtLeast18, maxDateOfBirth } from "@/lib/date";
import { useT } from "@/i18n/client";

export function SignupForm() {
  const t = useT();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (firstName.trim().length < 2) {
      setError(t("auth.signup.errorFirstName"));
      return;
    }
    if (!dob || !isAtLeast18(dob)) {
      setError(t("auth.signup.errorAge"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.signup.errorPassword"));
      return;
    }
    if (!agreed) {
      setError("Please confirm you are 18 or older and agree to the Terms and Privacy Policy.");
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
        data: {
          first_name: firstName.trim(),
          is_18_plus_confirmed: true,
          // Copied into the profile by the handle_new_user trigger.
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
        },
        emailRedirectTo: authCallbackUrl(),
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
      rememberPendingEmail(email.trim());
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
          {t("auth.signup.title")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {t("auth.signup.subtitle")}
        </p>
      </div>

      <Field label={t("auth.signup.firstName")}>
        <Input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder={t("auth.signup.firstNamePlaceholder")}
          autoComplete="given-name"
          maxLength={40}
          required
        />
      </Field>

      <Field label={t("auth.signup.dateOfBirth")} hint={t("auth.signup.dateOfBirthHint")}>
        <Input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          max={maxDateOfBirth()}
          required
        />
      </Field>

      <Field label={t("auth.signup.email")}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.signup.emailPlaceholder")}
          autoComplete="email"
          required
        />
      </Field>

      <Field label={t("auth.signup.password")} hint={t("auth.signup.passwordHint")}>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <label className="flex items-start gap-3 rounded-[1rem] bg-fill p-4">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
        />
        <span className="text-sm text-muted">
          I am 18 or older and I agree to the <TermsLink /> and have read the{" "}
          <PrivacyLink />.
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={loading} disabled={!agreed || loading}>
        {t("auth.signup.submit")}
      </Button>

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">{t("auth.orContinueWith")}</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <OAuthButtons />

      <p className="text-center text-sm text-muted">
        {t("auth.signup.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-brand">
          {t("auth.signup.signIn")}
        </Link>
      </p>
    </form>
  );
}
