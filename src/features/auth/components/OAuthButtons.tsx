"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GoogleLogo, AppleLogo } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

type Provider = "google" | "apple";

type Props = { next?: string; className?: string };

/**
 * Sign in with Apple needs an Apple Developer account and the Apple provider
 * configured in Supabase. Until then the button is shown but cannot be used.
 * Set NEXT_PUBLIC_APPLE_SIGNIN_ENABLED=true (and rebuild) to switch it on.
 */
const APPLE_ENABLED = process.env.NEXT_PUBLIC_APPLE_SIGNIN_ENABLED === "true";

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
        redirectTo: authCallbackUrl(next ?? "/onboarding/basics"),
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
        disabled={!APPLE_ENABLED || pending !== null}
        onClick={() => signInWithProvider("apple")}
        className={cn(!APPLE_ENABLED && "opacity-50 hover:border-line")}
      >
        <AppleLogo />
        Continue with Apple
        {!APPLE_ENABLED && (
          <span className="rounded-full bg-sunken px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-muted">
            <span className="sr-only">(</span>Coming soon<span className="sr-only">)</span>
          </span>
        )}
      </Button>

      {error && (
        <p role="alert" className="rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
