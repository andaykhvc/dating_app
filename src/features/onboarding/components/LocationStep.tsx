"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Select } from "@/components/ui/Field";
import { StepShell } from "@/features/onboarding/components/StepShell";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES } from "@/lib/constants";

export function LocationStep({
  initialCountry,
  initialCity,
}: {
  initialCountry: string;
  initialCity: string;
}) {
  const router = useRouter();
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ country_code: country, city: city.trim() || null })
      .eq("id", (await supabase.auth.getUser()).data.user!.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    router.push("/onboarding/languages");
  }

  return (
    <StepShell
      title="Where in the world?"
      subtitle="City and country only — never a precise location, and never a map."
      onContinue={save}
      canContinue={country.length === 2}
      loading={saving}
      error={error}
    >
      <div className="space-y-5">
        <Field label="Country">
          <Select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select a country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="City" hint="Optional. Leave blank if you would rather not say.">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Madrid"
            maxLength={80}
          />
        </Field>
      </div>
    </StepShell>
  );
}
