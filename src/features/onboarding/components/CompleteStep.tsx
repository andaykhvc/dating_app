"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

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
        Here is how it works: swipe through people who match your languages. When
        you both say yes, we hand you a mission — something real to talk about
        from the very first message.
      </p>

      <div className="mt-8 grid gap-3 text-left short:mt-6">
        {[
          ["Discover", "Swipe through language partners."],
          ["Match", "A mission arrives with every match."],
          ["Play", "Daily challenges, XP and your streak."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-line bg-raised p-4">
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="mt-0.5 text-xs text-muted">{body}</p>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-negative-soft px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <Button size="lg" fullWidth className="mt-8" onClick={finish} loading={saving}>
        Start swiping
      </Button>
    </div>
  );
}
