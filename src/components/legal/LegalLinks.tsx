import Link from "next/link";
import { LEGAL_DOCUMENT_PATHS } from "@/lib/legal";

/** Shared by public/auth screens and client Settings; no account data. */
export function LegalLinks() {
  const linkClass = "inline-flex min-h-11 items-center underline decoration-line underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";
  return (
    <nav aria-label="Legal information" className="flex flex-wrap items-center justify-center gap-x-5 text-sm text-muted">
      <div className="flex flex-wrap items-center justify-center gap-x-2">
        <Link href={LEGAL_DOCUMENT_PATHS.privacy.de} lang="de" className={linkClass}>Datenschutz</Link>
        <span aria-hidden="true">·</span>
        <Link href={LEGAL_DOCUMENT_PATHS.privacy.en} lang="en" className={linkClass}>Privacy</Link>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2">
        <Link href={LEGAL_DOCUMENT_PATHS.terms.de} lang="de" className={linkClass}>Nutzungsbedingungen</Link>
        <span aria-hidden="true">·</span>
        <Link href={LEGAL_DOCUMENT_PATHS.terms.en} lang="en" className={linkClass}>Terms</Link>
      </div>
    </nav>
  );
}
