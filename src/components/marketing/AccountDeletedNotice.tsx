"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Notice() {
  const params = useSearchParams();
  if (params.get("account") !== "deleted") return null;
  return (
    <p
      role="status"
      className="mb-6 rounded-2xl bg-positive-soft px-4 py-3 text-sm font-medium text-positive"
    >
      Your account was deleted. Thank you for trying Lingua Match.
    </p>
  );
}

/**
 * Shown on the landing page after /?account=deleted. Reading the query string
 * in the browser (inside Suspense) keeps the landing page itself static.
 */
export function AccountDeletedNotice() {
  return (
    <Suspense fallback={null}>
      <Notice />
    </Suspense>
  );
}
