import type { Metadata } from "next";
import type { PrivacyPolicy } from "./types";
import { LEGAL_DRAFT_MODE, LEGAL_ENTITY, legalPagesIndexable, legalSiteOrigin } from "../../lib/legal.ts";

export function privacyMetadata(policy: PrivacyPolicy): Metadata {
  const origin = legalSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const path = policy.language === "de" ? "/datenschutz" : "/privacy";
  return {
    title: policy.title,
    description: policy.description,
    alternates: {
      canonical: `${origin}${path}`,
      languages: { de: `${origin}/datenschutz`, en: `${origin}/privacy`, "x-default": `${origin}/datenschutz` },
    },
    robots: { index: legalPagesIndexable(LEGAL_ENTITY, LEGAL_DRAFT_MODE), follow: true },
  };
}
