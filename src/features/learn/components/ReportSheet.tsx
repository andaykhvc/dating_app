"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { SelectableChip } from "@/components/ui/Chip";
import { flagExercise } from "@/features/learn/api";
import { FLAG_REASONS, type FlagReason } from "@/features/learn/types";

const LABELS: Record<FlagReason, string> = {
  wrong_translation: "Wrong translation",
  typo: "Typo",
  unnatural: "Sounds unnatural",
  offensive: "Offensive",
  audio: "Pronunciation",
  other: "Something else",
};

/** Learner reports land in content_flags for review; nothing changes live. */
export function ReportSheet({
  open,
  onClose,
  sessionId,
  index,
}: {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  index: number;
}) {
  const [reason, setReason] = useState<FlagReason | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function close() {
    onClose();
    setTimeout(() => {
      setReason(null);
      setNote("");
      setState("idle");
    }, 300);
  }

  async function send() {
    if (!reason) return;
    setState("sending");
    try {
      await flagExercise(sessionId, index, reason, note);
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <Sheet open={open} onClose={close} title="Report a problem">
      {state === "sent" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Thanks — someone will look at it. Content that turns out to be wrong
            is fixed or taken out of lessons.
          </p>
          <Button fullWidth onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FLAG_REASONS.map((r) => (
              <SelectableChip key={r} selected={reason === r} onClick={() => setReason(r)}>
                {LABELS[r]}
              </SelectableChip>
            ))}
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="What should it say? (optional)"
          />
          {state === "error" && (
            <p role="alert" className="text-sm text-negative">
              Could not send that. Try again in a moment.
            </p>
          )}
          <Button fullWidth disabled={!reason} loading={state === "sending"} onClick={send}>
            Send report
          </Button>
        </div>
      )}
    </Sheet>
  );
}
