"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { InstallGuide } from "@/features/install/InstallGuide";

export function CompleteStep() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", (await supabase.auth.getUser()).data.user!.id);

    if (updateError) {
      // The database refuses to mark a profile complete while anything required
      // is missing, so this is where a half-finished flow surfaces.
      setError(
        "Something is still missing from your profile. Step back and check each screen.",
      );
      setSaving(false);
      return;
    }

    router.push("/discover");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-gutter pb-safe-12 pt-safe-12 text-center short:pb-safe-8 short:pt-safe-8 lg:py-16">
      <div className="animate-pop mx-auto flex size-20 items-center justify-center rounded-3xl bg-brand-soft text-brand">
        <LogoMark className="size-11" />
      </div>

      <h1 className="mt-8 text-3xl font-bold tracking-tight text-ink">
        You are set up
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Your next language partner is waiting. Add the app for a quick way back
        to your conversations and daily practice.
      </p>

      <div className="mt-8 rounded-3xl border border-line bg-raised p-5 short:mt-6">
        <InstallGuide />
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <Button size="lg" fullWidth className="mt-8" onClick={finish} loading={saving}>
        Start swiping
      </Button>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Adding the app is optional. You can also do it later in Settings.
      </p>
    </div>
  );
}
