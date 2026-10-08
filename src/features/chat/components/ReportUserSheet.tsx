"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Field";
import { reportUser } from "@/features/chat/api";
import { createClient } from "@/lib/supabase/client";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { REPORT_REASONS, type ReportReason } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * The report form, shared by the chat menu and the Discover profile sheet so a
 * person can be reported from wherever they are seen. `matchId` is null when
 * there is no conversation yet.
 */
export function ReportUserSheet({
  open,
  onClose,
  onBack,
  onReported,
  reportedId,
  reportedName,
  matchId,
}: {
  open: boolean;
  onClose: () => void;
  /** Shown as a "Back" button when the sheet was opened from a menu. */
  onBack?: () => void;
  onReported: () => void;
  reportedId: string;
  reportedName: string;
  matchId: string | null;
}) {
  const [reason, setReason] = useState<ReportReason>("harassment");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const { data } = await createClient().auth.getUser();
      if (!data.user) throw new Error("Please sign in again.");
      await reportUser(reportedId, data.user.id, reason, details, matchId);
      setDetails("");
      onReported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send that report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Report ${reportedName}`}>
      <div className="space-y-4">
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                reason === r
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-raised text-muted",
              )}
            >
              {REPORT_REASON_LABELS[r]}
            </button>
          ))}
        </div>

        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
          rows={3}
          placeholder="Anything else we should know? Optional."
        />

        {error && <p className="text-sm text-negative">{error}</p>}

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onBack ?? onClose}>
            {onBack ? "Back" : "Cancel"}
          </Button>
          <Button fullWidth onClick={submit} loading={busy}>
            Send report
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
