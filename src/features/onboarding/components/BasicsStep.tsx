"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "@/components/ui/Field";
import { StepShell } from "@/features/onboarding/components/StepShell";
import { createClient } from "@/lib/supabase/client";
import { isAtLeast18, maxDateOfBirth } from "@/lib/date";

export function BasicsStep({
  initialFirstName,
  initialDob,
}: {
  initialFirstName: string;
  initialDob: string;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [dob, setDob] = useState(initialDob);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    if (!isAtLeast18(dob)) {
      setError("You must be 18 or older to use Lingua Match.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ first_name: firstName.trim(), date_of_birth: dob })
      .eq("id", (await supabase.auth.getUser()).data.user!.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    router.push("/onboarding/location");
  }

  return (
    <StepShell
      title="First, the basics"
      subtitle="Your first name and age are shown on your card. Your exact date of birth never is."
      onContinue={save}
      canContinue={firstName.trim().length >= 2 && dob.length > 0}
      loading={saving}
      error={error}
    >
      <div className="space-y-5">
        <Field label="First name">
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Sofia"
            maxLength={40}
            autoComplete="given-name"
          />
        </Field>
        <Field label="Date of birth">
          <Input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={maxDateOfBirth()}
          />
        </Field>
      </div>
    </StepShell>
  );
}
