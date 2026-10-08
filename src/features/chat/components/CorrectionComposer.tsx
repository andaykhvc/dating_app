"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Input, Textarea } from "@/components/ui/Field";
import type { ChatMessage } from "@/types/domain";

/**
 * Manual correction, no AI in sight.
 *
 * The original is prefilled so correcting is an edit rather than a retype,
 * which is the difference between people doing this and not.
 */
export function CorrectionComposer({
  message,
  onClose,
  onSubmit,
}: {
  message: ChatMessage | null;
  onClose: () => void;
  onSubmit: (correctedText: string, note: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = message !== null;
  const original = message?.body ?? "";

  async function submit() {
    if (!text.trim() || text.trim() === original) {
      setError("Change something first, otherwise there is nothing to learn.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(text.trim(), note.trim());
      setText("");
      setNote("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Suggest a correction"
    >
      <div className="space-y-4">
        <div className="rounded-[1rem] bg-fill p-3.5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-faint">
            They wrote
          </p>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
            {original}
          </p>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-ink">
            Your version
          </span>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            onFocus={() => {
              if (!text) setText(original);
            }}
            rows={3}
            placeholder="Tap to start from their sentence…"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-ink">
            Why? <span className="font-normal text-faint">Optional</span>
          </span>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 300))}
            placeholder="Past tense of “go” is “went”"
          />
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <p className="text-xs text-faint">
          You both earn XP for this — you for helping, them for taking it.
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth onClick={submit} loading={saving}>
            Send correction
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
