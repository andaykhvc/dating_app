"use client";

import Link from "next/link";
import { PageBody } from "@/components/layout/Page";

export default function RankingsError({ reset }: { reset: () => void }) {
  return (
    <PageBody className="space-y-4 text-center">
      <h1 className="text-xl font-bold text-ink">Couldn’t load this page</h1>
      <p className="text-sm text-muted">Please try again in a moment.</p>
      <button
        onClick={reset}
        className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-ink"
      >
        Try again
      </button>
      <Link href="/play" className="block text-sm font-semibold text-brand">
        Back to Learn
      </Link>
    </PageBody>
  );
}
