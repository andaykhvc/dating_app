"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Select } from "@/components/ui/Field";
import { SelectableChip } from "@/components/ui/Chip";
import { StepShell } from "@/features/onboarding/components/StepShell";
import { createClient } from "@/lib/supabase/client";
import { CEFR_DESCRIPTIONS } from "@/lib/constants";
import { CEFR_LEVELS, type CefrLevel, type Language } from "@/types/domain";

export function LanguagesStep({
  languages,
  initialNative,
  initialLearning,
  initialLevel,
}: {
  languages: Language[];
  initialNative: string;
  initialLearning: string;
  initialLevel: CefrLevel;
}) {
  const router = useRouter();
  const [native, setNative] = useState(initialNative);
  const [learning, setLearning] = useState(initialLearning);
  const [level, setLevel] = useState<CefrLevel>(initialLevel);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const launch = languages.filter((l) => l.is_launch_language);
  const others = languages.filter((l) => !l.is_launch_language);

  async function save() {
    setError(null);
    if (native === learning) {
      setError("Pick a different language to learn than the one you speak.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user!.id;

    // Replace rather than merge: the MVP allows exactly one of each, so
    // clearing first keeps a changed answer from leaving a stale row behind.
    const { error: deleteError } = await supabase
      .from("user_languages")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("user_languages").insert([
      { user_id: userId, language_code: native, role: "native", cefr_level: null },
      {
        user_id: userId,
        language_code: learning,
        role: "learning",
        cefr_level: level,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    router.push("/onboarding/photos");
  }

  function renderOptions() {
    return (
      <>
        <optgroup label="Available now">
          {launch.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag_emoji} {l.name}
            </option>
          ))}
        </optgroup>
        {others.length > 0 && (
          <optgroup label="More languages">
            {others.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag_emoji} {l.name}
              </option>
            ))}
          </optgroup>
        )}
      </>
    );
  }

  return (
    <StepShell
      title="What are you swapping?"
      subtitle="This is what everything else is built on — who you see, and which challenges you get."
      onContinue={save}
      canContinue={Boolean(native && learning)}
      loading={saving}
      error={error}
    >
      <div className="space-y-6">
        <div className="grid items-start gap-6 sm:grid-cols-2 sm:gap-4">
          <Field label="I speak natively">
            <Select value={native} onChange={(e) => setNative(e.target.value)}>
              <option value="">Select a language</option>
              {renderOptions()}
            </Select>
          </Field>

          <Field
            label="I want to learn"
            hint="Challenges and practice content come from this language."
          >
            <Select value={learning} onChange={(e) => setLearning(e.target.value)}>
              <option value="">Select a language</option>
              {renderOptions()}
            </Select>
          </Field>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-ink">
            My level
          </span>
          <div className="flex flex-wrap gap-2">
            {CEFR_LEVELS.map((l) => (
              <SelectableChip
                key={l}
                selected={level === l}
                onClick={() => setLevel(l)}
              >
                {l}
              </SelectableChip>
            ))}
          </div>
          <p className="mt-2 text-xs text-faint">{CEFR_DESCRIPTIONS[level]}</p>
        </div>
      </div>
    </StepShell>
  );
}
