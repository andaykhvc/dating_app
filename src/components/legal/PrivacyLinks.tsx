import Link from "next/link";

/** Reused in public/auth screens and client-side Settings; no account data. */
export function PrivacyLinks() {
  return (
    <nav aria-label="Privacy information" className="flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted">
      <Link href="/datenschutz" lang="de" className="inline-flex min-h-11 items-center underline decoration-line underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
        Datenschutz
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/privacy" lang="en" className="inline-flex min-h-11 items-center underline decoration-line underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
        Privacy
      </Link>
    </nav>
  );
}
