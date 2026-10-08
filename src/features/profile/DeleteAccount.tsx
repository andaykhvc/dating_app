"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { DELETE_CONFIRMATION_WORD } from "@/lib/account-delete";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = typed.trim() === DELETE_CONFIRMATION_WORD;

  function close() {
    if (busy) return;
    setOpen(false);
    setTyped("");
    setError(null);
  }

  async function deleteAccount() {
    if (!confirmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: DELETE_CONFIRMATION_WORD }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "We could not delete your account. Please try again.");
      }
      // Drop the browser-side session too, then leave the signed-in app; the
      // refresh discards everything cached for the deleted account.
      await createClient().auth.signOut({ scope: "local" }).catch(() => undefined);
      router.replace("/?account=deleted");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not delete your account. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-negative/30 bg-raised p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-negative">Danger zone</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Permanently delete your account and everything in it. This cannot be undone.
      </p>
      <Button type="button" variant="danger" fullWidth className="mt-3" onClick={() => setOpen(true)}>
        Delete account
      </Button>

      <Sheet open={open} onClose={close} title="Delete your account?">
        <div className="space-y-4">
          <div className="text-sm leading-relaxed text-muted">
            <p>This permanently deletes:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>your profile, photos, languages and interests</li>
              <li>your matches and every conversation in them — your matches will no longer see them either</li>
              <li>your XP, streak, lessons and progress</li>
            </ul>
            <p className="mt-3">
              You will be signed out right away and cannot sign back in to this account.
            </p>
          </div>

          <Field label={`Type ${DELETE_CONFIRMATION_WORD} to confirm`} error={error}>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter") void deleteAccount();
              }}
            />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              type="button"
              variant="danger"
              fullWidth
              loading={busy}
              disabled={!confirmed || busy}
              onClick={deleteAccount}
            >
              Delete my account
            </Button>
            <Button type="button" variant="secondary" fullWidth disabled={busy} onClick={close}>
              Cancel
            </Button>
          </div>
        </div>
      </Sheet>
    </section>
  );
}
