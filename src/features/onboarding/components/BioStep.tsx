"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/Field";
import { StepShell } from "@/features/onboarding/components/StepShell";
import { createClient } from "@/lib/supabase/client";

const MAX_BIO = 300;

const EXAMPLES = [
  "I can teach you the Spanish people actually use.",
  "Berlin. Coffee, bad puns, patient with beginners.",
  "Learning English for work, staying for the films.",
];

export function BioStep({ initialBio }: { initialBio: string }) {
  const router = useRouter();
  const [bio, setBio] = useState(initialBio);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(value: string) {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ bio: value.trim() || null })
      .eq("id", (await supabase.auth.getUser()).data.user!.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    router.push("/onboarding/preferences");
  }

  return (
    <StepShell
      title="One line about you"
      subtitle="This sits under your name on your card. Short beats clever."
      onContinue={() => save(bio)}
      loading={saving}
      error={error}
      optional
      onSkip={() => save("")}
    >
      <Textarea
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
        rows={4}
        placeholder={EXAMPLES[0]}
      />
      <p className="mt-2 text-right text-xs text-faint">
        {bio.length}/{MAX_BIO}
      </p>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
          Need a nudge
        </p>
        <div className="space-y-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setBio(example)}
              className="w-full rounded-2xl bg-raised shadow-[var(--shadow-card)] px-4 py-3 text-left text-sm text-muted transition-colors hover:border-brand/40 hover:text-ink"
            >
              “{example}”
            </button>
          ))}
        </div>
      </div>
    </StepShell>
  );
}
