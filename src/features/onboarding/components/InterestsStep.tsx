"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SelectableChip } from "@/components/ui/Chip";
import { StepShell } from "@/features/onboarding/components/StepShell";
import { createClient } from "@/lib/supabase/client";
import { saveInterests } from "@/features/profile/saveLists";
import type { Interest } from "@/types/domain";

const MIN_INTERESTS = 2;
const MAX_INTERESTS = 8;

export function InterestsStep({
  interests,
  initialSelected,
}: {
  interests: Interest[];
  initialSelected: number[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>(initialSelected);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_INTERESTS
          ? prev
          : [...prev, id],
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user!.id;

    const failure = await saveInterests(supabase, userId, selected);
    if (failure) {
      setError(failure);
      setSaving(false);
      return;
    }
    router.push("/onboarding/bio");
  }

  return (
    <StepShell
      title="What do you actually talk about?"
      subtitle={`Pick ${MIN_INTERESTS} to ${MAX_INTERESTS}. Up to four appear on your card.`}
      onContinue={save}
      canContinue={selected.length >= MIN_INTERESTS}
      loading={saving}
      error={error}
    >
      <div className="flex flex-wrap gap-2">
        {interests.map((interest) => (
          <SelectableChip
            key={interest.id}
            selected={selected.includes(interest.id)}
            onClick={() => toggle(interest.id)}
            disabled={
              !selected.includes(interest.id) && selected.length >= MAX_INTERESTS
            }
          >
            {interest.emoji} {interest.label}
          </SelectableChip>
        ))}
      </div>
      <p className="mt-4 text-xs text-faint">
        {selected.length} of {MAX_INTERESTS} selected
      </p>
    </StepShell>
  );
}
