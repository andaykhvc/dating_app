"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { MoreIcon } from "@/components/icons";
import { blockUser } from "@/features/chat/api";
import { ReportUserSheet } from "@/features/chat/components/ReportUserSheet";

type Mode = null | "menu" | "report" | "block";

export function ReportBlockMenu({
  partnerId,
  partnerName,
  matchId,
}: {
  partnerId: string;
  partnerName: string;
  matchId: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

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

      <ReportUserSheet
        open={mode === "report"}
        onClose={() => setMode(null)}
        onBack={() => setMode("menu")}
        onReported={() => {
          setReported(true);
          setMode(null);
        }}
        reportedId={partnerId}
        reportedName={partnerName}
        matchId={matchId}
      />

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
