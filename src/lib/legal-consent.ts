import { PRIVACY_VERSION } from "../content/legal/privacy.config.ts";
import { TERMS_VERSION } from "../content/legal/terms.config.ts";

/**
 * Which versions of the legal documents a person has accepted, and whether they
 * must accept again. The versions are the ones printed on the published pages
 * (src/content/legal/*.config.ts), so what someone accepts is exactly what they
 * were shown. Changing a version there makes everyone whose stored version
 * differs see the "We updated our terms" step once.
 */
export { PRIVACY_VERSION, TERMS_VERSION };

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
