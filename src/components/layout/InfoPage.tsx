import Link from "next/link";
import { BackIcon } from "@/components/icons";
import type { InfoContent, InfoLocale } from "@/content/info/types";
import { SUPPORT_EMAIL } from "@/lib/support";

const LABELS = {
  en: { back: "Back", contact: "Contact us", noEmail: "Our support email address is not published yet.", other: "Deutsch" },
  de: { back: "Zurück", contact: "Kontakt", noEmail: "Unsere Support-E-Mail-Adresse ist noch nicht veröffentlicht.", other: "English" },
} as const;

/**
 * A plain public page of headings and paragraphs, in English or German
 * (?lang=de). Shared by /support and /guidelines; readable signed out.
 */
export function InfoPage({
  content,
  locale,
  path,
  links = [],
  showContact = false,
}: {
  content: InfoContent;
  locale: InfoLocale;
  path: string;
  links?: { href: string; label: Record<InfoLocale, string> }[];
  showContact?: boolean;
}) {
  const page = content[locale];
  const labels = LABELS[locale];
  const other = locale === "en" ? "de" : "en";

  return (
    <main lang={locale} className="safe-top mx-auto w-full max-w-2xl px-gutter pb-16 pt-6 md:pt-10">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium text-muted hover:bg-fill hover:text-ink"
        >
          <BackIcon className="size-4" /> {labels.back}
        </Link>
        <Link
          href={`${path}?lang=${other}`}
          hrefLang={other}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft"
        >
          {labels.other}
        </Link>
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink md:text-3xl">{page.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{page.intro}</p>

      <div className="mt-8 space-y-6">
        {page.sections.map((section) => (
          <section key={section.heading} className="surface-card p-5 md:p-6">
            <h2 className="text-base font-bold text-ink">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      {showContact && (
        <section className="mt-6 surface-card p-5 md:p-6">
          <h2 className="text-base font-bold text-ink">{labels.contact}</h2>
          {SUPPORT_EMAIL ? (
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-2 inline-block text-sm font-semibold text-brand hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          ) : (
            <p className="mt-2 text-sm text-muted">{labels.noEmail}</p>
          )}
        </section>
      )}

      {links.length > 0 && (
        <ul className="mt-6 space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={`${link.href}?lang=${locale}`}
                className="flex items-center justify-between surface-card press-soft p-5 text-sm font-semibold text-ink hover:brightness-[0.98] dark:hover:brightness-110"
              >
                {link.label[locale]}
                <span aria-hidden className="text-faint">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
