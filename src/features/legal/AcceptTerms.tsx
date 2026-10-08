"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal-consent";
import { createClient } from "@/lib/supabase/client";
import { PrivacyLink, TermsLink } from "./LegalLinks";

/**
 * The acceptance step for anyone who has no (or an out-of-date) acceptance on
 * file: OAuth signups, existing users, and everyone after a version change.
 * The checkbox starts unticked on purpose.
 */
export function AcceptTerms({ mode }: { mode: "first" | "updated" }) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!agreed || busy) return;
    setBusy(true);
    setError(null);
    const { error: rpcError } = await createClient().rpc("accept_legal_terms", {
      p_terms_version: TERMS_VERSION,
      p_privacy_version: PRIVACY_VERSION,
    });
    if (rpcError) {
      setError("We could not save that. Please try again.");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-gutter py-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        {mode === "updated" ? "We updated our terms" : "One more thing"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {mode === "updated"
          ? "Please review the updated Terms and Privacy Policy to keep using Lingua Match."
          : "Before you continue, please read and accept how Lingua Match works."}
      </p>

      <label className="mt-6 flex items-start gap-3 rounded-2xl bg-sunken p-4">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
        />
        <span className="text-sm text-muted">
          I am 18 or older and I agree to the <TermsLink /> and have read the <PrivacyLink />.
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-3 rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <Button type="button" size="lg" fullWidth className="mt-5" loading={busy} disabled={!agreed || busy} onClick={accept}>
        Agree and continue
      </Button>
    </div>
  );
}
