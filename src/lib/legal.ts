/**
 * Versions of the legal documents people have to accept. Bump a constant when
 * the matching text changes in a way that needs fresh consent: everyone whose
 * stored version differs sees the "We updated our terms" step once.
 *
 * Use the date the new text takes effect (YYYY-MM-DD).
 */
export const TERMS_VERSION = "2026-10-08";
export const PRIVACY_VERSION = "2026-10-08";

export const LEGAL_PATHS = {
  terms: "/terms",
  privacy: "/privacy",
} as const;

export type LegalAcceptance = {
  terms_version: string | null;
  privacy_version: string | null;
};

/** What a profile still has to accept; null when it is up to date. */
export function pendingLegal(
  profile: Partial<LegalAcceptance> | null | undefined,
  current = { terms: TERMS_VERSION, privacy: PRIVACY_VERSION },
): "first" | "updated" | null {
  const terms = profile?.terms_version ?? null;
  const privacy = profile?.privacy_version ?? null;
  if (!terms || !privacy) return "first";
  if (terms !== current.terms || privacy !== current.privacy) return "updated";
  return null;
}
