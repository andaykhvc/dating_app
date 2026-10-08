"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Fetches the export and saves it through a temporary link, rather than
 * navigating to the URL, so a rate-limit or sign-in error can be shown here
 * instead of replacing the page with raw JSON.
 */
export function DownloadMyData() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function download() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/account/export", { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not download your data. Please try again.");
      }

      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "lingua-match-my-data.json";
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the browser a moment to start the download before releasing the blob.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setMessage({ kind: "ok", text: "Your data was downloaded." });
    } catch (e) {
      setMessage({
        kind: "error",
        text: e instanceof Error ? e.message : "Could not download your data. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-raised p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">Your data</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Get a copy of everything we hold about you — profile, photos list, matches, messages,
        progress — as a JSON file.
      </p>
      <Button
        type="button"
        variant="secondary"
        fullWidth
        className="mt-3"
        loading={busy}
        disabled={busy}
        onClick={download}
      >
        {busy ? "Preparing…" : "Download my data"}
      </Button>
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={message.kind === "error" ? "mt-2 text-xs text-negative" : "mt-2 text-xs text-positive"}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
