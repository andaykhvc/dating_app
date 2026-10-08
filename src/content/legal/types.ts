import type { ReportReason } from "../../types/domain";

export type LegalLink = { label: string; href: string };
export type CommunityRule = {
  id: string;
  title: string;
  description: string;
  reportReasons: ReportReason[];
};
export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  rules?: CommunityRule[];
  gap?: string;
  links?: LegalLink[];
};
export type LegalDocument = {
  kind: "privacy" | "terms" | "imprint";
  language: "de" | "en";
  title: string;
  description: string;
  version: string;
  lastUpdated: string;
  intro: string;
  summary: string[];
  sections: LegalSection[];
};
export type PrivacyPolicy = LegalDocument & { kind: "privacy" };
export type TermsPolicy = LegalDocument & { kind: "terms" };
export type ImprintPolicy = LegalDocument & { kind: "imprint" };
