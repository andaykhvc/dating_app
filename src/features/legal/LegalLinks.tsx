import { LEGAL_PATHS } from "@/lib/legal-consent";

const LINK = "font-semibold text-brand underline-offset-2 hover:underline";

/** Links open in a new tab so the form someone is filling in is not lost. */
export function TermsLink({ children = "Terms" }: { children?: React.ReactNode }) {
  return (
    <a href={LEGAL_PATHS.terms} target="_blank" rel="noopener noreferrer" className={LINK}>
      {children}
    </a>
  );
}

export function PrivacyLink({ children = "Privacy Policy" }: { children?: React.ReactNode }) {
  return (
    <a href={LEGAL_PATHS.privacy} target="_blank" rel="noopener noreferrer" className={LINK}>
      {children}
    </a>
  );
}
