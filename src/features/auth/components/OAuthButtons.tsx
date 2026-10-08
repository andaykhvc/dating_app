"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GoogleLogo, AppleLogo } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { PrivacyLink, TermsLink } from "@/features/legal/LegalLinks";

type Provider = "google" | "apple";

type Props = { next?: string; className?: string };

export function OAuthButtons({ next, className }: Props) {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWithProvider(provider: Provider) {
    setError(null);
    setPending(provider);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? "/onboarding/basics")}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setPending(null);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        loading={pending === "google"}
        disabled={pending !== null}
        onClick={() => signInWithProvider("google")}
      >
        <GoogleLogo />
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        loading={pending === "apple"}
        disabled={pending !== null}
        onClick={() => signInWithProvider("apple")}
      >
        <AppleLogo />
        Continue with Apple
      </Button>

      {error && (
        <p role="alert" className="rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <p className="text-center text-xs leading-relaxed text-faint">
        By continuing you agree to the <TermsLink /> and acknowledge the{" "}
        <PrivacyLink />. You will be asked to confirm after signing in.
      </p>
    </div>
  );
}
