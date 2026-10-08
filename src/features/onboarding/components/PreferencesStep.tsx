"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/features/onboarding/components/StepShell";
import { IntentionPicker } from "@/features/profile/IntentionPicker";
import { AgeRangeSlider } from "@/features/profile/AgeRangeSlider";
import { CountryPicker } from "@/features/profile/CountryPicker";
import { createClient } from "@/lib/supabase/client";
import type { Intention } from "@/types/domain";

export function PreferencesStep({
  initialIntentions,
  initialDatingConsent,
  initialAgeMin,
  initialAgeMax,
  initialCountries,
  initialHideDating,
}: {
  initialIntentions: Intention[];
  initialDatingConsent: boolean;
  initialAgeMin: number;
  initialAgeMax: number;
  initialCountries: string[];
  initialHideDating: boolean;
}) {
  const router = useRouter();
  const [intentions, setIntentions] = useState<Intention[]>(
    initialIntentions.length ? initialIntentions : ["language_buddy"],
  );
  const [datingConsent, setDatingConsent] = useState(initialDatingConsent);
  const [ageMin, setAgeMin] = useState(initialAgeMin);
  const [ageMax, setAgeMax] = useState(initialAgeMax);
  const [countries, setCountries] = useState<string[]>(initialCountries);
  const [hideDating, setHideDating] = useState(initialHideDating);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        intentions,
        // Any value means "consented"; the database stamps the real time.
        dating_consent_at: datingConsent ? new Date().toISOString() : null,
        preferred_age_min: ageMin,
        preferred_age_max: ageMax,
        preferred_countries: countries,
        hide_dating_profiles: hideDating,
      })
      .eq("id", (await supabase.auth.getUser()).data.user!.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    router.push("/onboarding/complete");
  }

  return (
    <StepShell
      title="Why you are here"
      subtitle="Pick everything that fits. Dating is entirely optional, and others can filter it out."
      onContinue={save}
      canContinue={
        intentions.length > 0 && (!intentions.includes("open_to_dating") || datingConsent)
      }
      loading={saving}
      error={error}
    >
      <div className="space-y-8">
        <IntentionPicker
          value={intentions}
          onChange={setIntentions}
          datingConsent={datingConsent}
          onDatingConsentChange={setDatingConsent}
        />

        <div>
          <span className="mb-3 block text-sm font-semibold text-ink">
            Age range
          </span>
          <AgeRangeSlider
            min={ageMin}
            max={ageMax}
            onChange={(lo, hi) => {
              setAgeMin(lo);
              setAgeMax(hi);
            }}
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-semibold text-ink">
            Countries
          </span>
          <p className="mb-3 text-xs text-faint">
            Optional. Leave empty to meet people anywhere.
          </p>
          <CountryPicker value={countries} onChange={setCountries} />
        </div>

        <label className="flex items-start gap-3 rounded-2xl bg-raised shadow-[var(--shadow-card)] p-4">
          <input
            type="checkbox"
            checked={hideDating}
            onChange={(e) => setHideDating(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--brand)]"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">
              Language partners only
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">
              Hides everyone who is open to dating from your Discover feed.
            </span>
          </span>
        </label>
      </div>
    </StepShell>
  );
}
