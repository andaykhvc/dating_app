export type LegalLink = { label: string; href: string };
export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  gap?: string;
  links?: LegalLink[];
};
export type PrivacyPolicy = {
  language: "de" | "en";
  title: string;
  description: string;
  version: string;
  lastUpdated: string;
  intro: string;
  summary: string[];
  sections: LegalSection[];
};
