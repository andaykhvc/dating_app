import type { Metadata } from "next";
import type { LegalDocument, PrivacyPolicy } from "./types";
import { LEGAL_DOCUMENT_PATHS, LEGAL_DRAFT_MODE, LEGAL_ENTITY, imprintFieldIssues, legalPagesIndexable, legalSiteOrigin } from "../../lib/legal.ts";

export function legalMetadata(policy: LegalDocument): Metadata {
  const origin = legalSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const paths = LEGAL_DOCUMENT_PATHS[policy.kind];
  const path = paths[policy.language];
  return {
    title: policy.title,
    description: policy.description,
    alternates: {
      canonical: `${origin}${path}`,
      languages: { de: `${origin}${paths.de}`, en: `${origin}${paths.en}`, "x-default": `${origin}${paths.de}` },
    },
    robots: { index: legalPagesIndexable(LEGAL_ENTITY, LEGAL_DRAFT_MODE) && (policy.kind !== "imprint" || imprintFieldIssues(LEGAL_ENTITY).length === 0), follow: true },
  };
}

export function privacyMetadata(policy: PrivacyPolicy): Metadata {
  return legalMetadata(policy);
}
