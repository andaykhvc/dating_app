"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Field";
import { MoreIcon } from "@/components/icons";
import { blockUser, reportUser } from "@/features/chat/api";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { REPORT_REASONS, type ReportReason } from "@/types/domain";
import { cn } from "@/lib/utils";

type Mode = null | "menu" | "report" | "block";

export function ReportBlockMenu({
  partnerId,
  partnerName,
  viewerId,
  matchId,
}: {
  partnerId: string;
  partnerName: string;
  viewerId: string;
  matchId: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState<ReportReason>("harassment");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  async function submitReport() {
    setBusy(true);
    setError(null);
    try {
      await reportUser(partnerId, viewerId, reason, details, matchId);
      setReported(true);
      setMode(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send that report.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmBlock() {
    setBusy(true);
    setError(null);
    try {
      await blockUser(partnerId);
      router.push("/matches");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not block them.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMode("menu")}
        aria-label={`Options for ${partnerName}`}
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunken"
      >
        <MoreIcon className="size-5" />
      </button>

      <Sheet
        open={mode === "menu"}
        onClose={() => setMode(null)}
        title={partnerName}
      >
        <div className="space-y-2">
          {reported && (
            <p className="rounded-2xl bg-positive-soft px-4 py-3 text-sm text-positive">
              Thanks — we have your report.
            </p>
          )}
          <button
            type="button"
            onClick={() => setMode("report")}
            className="w-full rounded-2xl bg-sunken px-4 py-3.5 text-left text-sm font-semibold text-ink hover:brightness-95"
          >
            Report {partnerName}
            <span className="mt-0.5 block text-xs font-normal text-muted">
              Sends this conversation to us for review.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("block")}
            className="w-full rounded-2xl bg-negative-soft px-4 py-3.5 text-left text-sm font-semibold text-negative hover:brightness-95"
          >
            Block {partnerName}
            <span className="mt-0.5 block text-xs font-normal text-negative/80">
              Ends the match and hides you from each other.
            </span>
          </button>
        </div>
      </Sheet>

      <Sheet
        open={mode === "report"}
        onClose={() => setMode(null)}
        title={`Report ${partnerName}`}
      >
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
            <Button variant="secondary" fullWidth onClick={() => setMode("menu")}>
              Back
            </Button>
            <Button fullWidth onClick={submitReport} loading={busy}>
              Send report
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={mode === "block"}
        onClose={() => setMode(null)}
        title={`Block ${partnerName}?`}
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted">
            Your match ends, neither of you appears in the other&apos;s Discover
            feed, and no more messages can be sent. You can undo this from
            Settings.
          </p>
          {error && <p className="text-sm text-negative">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setMode("menu")}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={confirmBlock} loading={busy}>
              Block
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
