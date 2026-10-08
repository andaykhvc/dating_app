import Link from "next/link";
import { APP_NAME, REPORT_REASON_LABELS } from "@/lib/constants";
import { LEGAL_DOCUMENT_PATHS, LEGAL_DRAFT_MODE, LEGAL_ENTITY, imprintFieldIssues, phoneHref } from "@/lib/legal";
import type { LegalDocument } from "@/content/legal/types";
import { ImprintDetails } from "./ImprintDetails";

const copy = {
  de: {
    back: "Zur Startseite", language: "Sprache dieser Erklärung", switchLabel: "English version",
    updated: "Stand", summary: "Das Wichtigste auf einen Blick", contents: "Inhalt",
    draft: "Entwurf — rechtliche Prüfung ausstehend", draftText: "Dieser Entwurf dokumentiert den geprüften App-Stand. Offen gekennzeichnete Angaben und Verfahren sind vor der endgültigen Freigabe zu klären. Die Erklärung ist keine Einwilligung.",
    gap: "Noch zu klären", controller: "Verantwortlicher", name: "Name / Firma", address: "Postanschrift",
    email: "E-Mail", privacy: "Datenschutz-E-Mail", dpo: "Datenschutzbeauftragter",
    missing: "FEHLT — noch nicht angegeben", unverified: "Benennungspflicht und Kontaktdaten noch zu prüfen",
    sources: "Quellen und weitere Informationen", top: "Zum Seitenanfang",
    post: "Datenschutzanfragen können schriftlich an die angegebene Postanschrift gerichtet werden. Die elektronische Kontaktadresse wird ergänzt, sobald sie bestätigt ist.",
    termsLanguage: "Sprache der Nutzungsbedingungen", termsSummary: "Kurzfassung", provider: "Anbieter",
    termsDraft: "Dieser Entwurf bedarf rechtlicher Prüfung und wirksamer Vereinbarung. Die Verlinkung allein begründet keine Zustimmung; offene Angaben und Verfahren sind vor Freigabe zu klären.",
    reportReason: "Meldegrund im App-Menü", termsPost: "Anfragen können schriftlich an die angegebene Postanschrift gerichtet werden.",
    imprintLanguage: "Sprache des Impressums", imprintDraft: "Dieses Impressum ist ein Entwurf zur rechtlichen Prüfung. Bestätigte Angaben werden veröffentlicht; noch offene Kontaktwege und Anwendbarkeitsfragen müssen vor der Freigabe geklärt werden.",
    incomplete: "Impressum unvollständig", incompleteText: "Pflichtangaben oder ihre Anwendbarkeit sind noch nicht vollständig bestätigt. Die Seite bleibt von der Suchindexierung ausgeschlossen; fehlende Angaben sind unten mit MISSING gekennzeichnet.",
    phone: "Telefon",
  },
  en: {
    back: "Back to home", language: "Notice language", switchLabel: "Deutsche Fassung",
    updated: "Last updated", summary: "At a glance", contents: "Contents",
    draft: "Draft — legal review pending", draftText: "This draft records the reviewed app implementation. Outstanding facts and procedures must be resolved before approval. This notice does not give consent.",
    gap: "Outstanding confirmation", controller: "Controller", name: "Legal name", address: "Postal address",
    email: "Email", privacy: "Privacy email", dpo: "Data protection officer",
    missing: "MISSING — not provided yet", unverified: "Appointment requirement and contact details need assessment",
    sources: "Sources and further information", top: "Back to top",
    post: "Privacy requests can be sent in writing to the postal address shown. An electronic contact address will be added once confirmed.",
    termsLanguage: "Terms language", termsSummary: "The short version", provider: "Service provider",
    termsDraft: "These terms need legal review and valid agreement. Linking them alone does not record acceptance. Outstanding facts and procedures must be resolved before approval.",
    reportReason: "Report reason in the app menu", termsPost: "Requests can be sent in writing to the postal address shown.",
    imprintLanguage: "Legal notice language", imprintDraft: "This legal notice is a draft for legal review. Confirmed details are published; outstanding contact channels and applicability decisions must be settled before approval.",
    incomplete: "Incomplete legal notice", incompleteText: "Required details or their applicability are not fully confirmed. This page remains excluded from search indexing. Outstanding fields are marked MISSING below.",
    phone: "Phone",
  },
};

export function LegalPage({ policy }: { policy: LegalDocument }) {
  const labels = copy[policy.language];
  const isTerms = policy.kind === "terms";
  const isImprint = policy.kind === "imprint";
  const incomplete = isImprint && imprintFieldIssues(LEGAL_ENTITY).length > 0;
  const paths = LEGAL_DOCUMENT_PATHS[policy.kind];
  const otherLanguage = policy.language === "de" ? "en" : "de";
  const summaryId = `${policy.kind}-summary`;
  const contentsId = `${policy.kind}-contents`;
  const email = isTerms ? LEGAL_ENTITY.email : LEGAL_ENTITY.privacyEmail ?? LEGAL_ENTITY.email;
  const fields = [
    { label: labels.name, value: LEGAL_ENTITY.name },
    { label: labels.address, value: LEGAL_ENTITY.address },
    { label: labels.email, value: LEGAL_ENTITY.email },
    { label: labels.phone, value: LEGAL_ENTITY.phone, href: phoneHref(LEGAL_ENTITY.phone) },
    ...(!isTerms ? [{ label: labels.privacy, value: email }] : []),
  ];
  const sectionLink = "rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";

  return (
    <main id="legal-top" lang={policy.language} className="safe-top mx-auto w-full max-w-3xl px-gutter pb-16 pt-6 md:pt-10">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className={`inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted hover:text-ink ${sectionLink}`}>
            <span aria-hidden="true">←</span> {labels.back}
          </Link>
          <nav aria-label={isImprint ? labels.imprintLanguage : isTerms ? labels.termsLanguage : labels.language}>
            <Link href={paths[otherLanguage]} lang={otherLanguage} hrefLang={otherLanguage} className={`inline-flex min-h-11 items-center text-sm font-semibold text-brand underline underline-offset-4 ${sectionLink}`}>
              {labels.switchLabel}
            </Link>
          </nav>
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brand">{APP_NAME}</p>
        <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-ink sm:text-4xl">{policy.title}</h1>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>{labels.updated}: <time dateTime={policy.lastUpdated}>{new Intl.DateTimeFormat(policy.language, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${policy.lastUpdated}T12:00:00Z`))}</time></span>
          <span>Version: {policy.version}</span>
        </p>
        {LEGAL_DRAFT_MODE && (
          <aside aria-labelledby="draft-heading" className="mt-6 rounded-3xl border border-accent/50 bg-accent-soft p-5 text-ink">
            <h2 lang="en" id="draft-heading" className="text-sm font-bold">DRAFT — pending legal review</h2>
            <p className="mt-1 text-sm font-semibold">{labels.draft}</p>
            <p className="mt-2 text-sm leading-relaxed">{isImprint ? labels.imprintDraft : isTerms ? labels.termsDraft : labels.draftText}</p>
          </aside>
        )}
        {incomplete && (
          <aside aria-labelledby="incomplete-heading" className="mt-5 rounded-2xl border border-negative/40 bg-sunken p-5 text-sm leading-6">
            <h2 id="incomplete-heading" className="font-bold text-negative">{labels.incomplete}</h2>
            <p className="mt-2 text-muted">{labels.incompleteText}</p>
          </aside>
        )}
        <p className="mt-6 text-base leading-7 text-muted">{policy.intro}</p>
      </header>

      <section aria-labelledby={summaryId} className="mt-8 surface-card p-5 sm:p-6">
        <h2 id={summaryId} className="text-lg font-bold text-ink">{isTerms ? labels.termsSummary : labels.summary}</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-muted">
          {policy.summary.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <nav aria-labelledby={contentsId} className="mt-8 rounded-[var(--radius-group)] bg-fill p-5 sm:p-6">
        <h2 id={contentsId} className="text-lg font-bold text-ink">{labels.contents}</h2>
        <ol className="mt-3 grid gap-x-6 sm:grid-cols-2">
          {policy.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className={`flex min-h-11 items-center py-2 text-sm leading-5 text-muted hover:text-brand ${sectionLink}`}>
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="mt-10 space-y-10">
        {policy.sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-6 border-t border-line pt-6">
            <h2 id={`${section.id}-heading`} className="break-words text-xl font-bold leading-7 text-ink">{section.title}</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted sm:text-base">
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            {isImprint && section.id === "provider" && <ImprintDetails language={policy.language} />}
            {((!isTerms && section.id === "controller") || (isTerms && section.id === "provider")) && (
              <div className="mt-5 surface-card p-5">
                <h3 className="text-sm font-bold text-ink">{isTerms ? labels.provider : labels.controller}</h3>
                <dl className="mt-4 space-y-4 text-sm">
                  {fields.map((field) => (
                    <div key={field.label} className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
                      <dt className="font-semibold text-muted">{field.label}</dt>
                      <dd className={`whitespace-pre-line break-words ${field.value ? "text-ink" : "font-semibold text-negative"}`}>
                        {field.href ? <a href={field.href} className={`inline-flex min-h-11 items-center text-brand underline underline-offset-4 ${sectionLink}`}>{field.value}</a> : field.value ?? labels.missing}
                      </dd>
                    </div>
                  ))}
                  {!isTerms && <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="font-semibold text-muted">{labels.dpo}</dt>
                    <dd className="break-words text-muted">{LEGAL_ENTITY.dataProtectionOfficer ?? labels.unverified}</dd>
                  </div>}
                </dl>
                {email ? (
                  <a href={`mailto:${email}`} className={`mt-4 inline-flex min-h-11 items-center break-all text-sm font-semibold text-brand underline underline-offset-4 ${sectionLink}`}>{email}</a>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-muted">{isTerms ? labels.termsPost : labels.post}</p>
                )}
              </div>
            )}
            {section.rules && (
              <ul className="mt-5 space-y-3">
                {section.rules.map((rule) => (
                  <li key={rule.id} className="rounded-2xl bg-raised shadow-[var(--shadow-card)] p-4 sm:p-5">
                    <h3 className="text-base font-bold text-ink">{rule.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted">{rule.description}</p>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      <span className="font-semibold">{labels.reportReason}: </span>
                      {rule.reportReasons.map((reason, index) => (
                        <span key={reason}>{index > 0 && " / "}<span lang="en">{REPORT_REASON_LABELS[reason]}</span></span>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {section.bullets && (
              <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-muted sm:text-base">
                {section.bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
            {section.gap && (
              <aside className="mt-5 rounded-2xl border border-line bg-sunken p-4 text-sm leading-6 text-muted">
                <p className="font-bold text-ink">{labels.gap}</p>
                <p className="mt-1">{section.gap}</p>
              </aside>
            )}
            {section.links && (
              <nav aria-label={`${labels.sources}: ${section.title}`} className="mt-4">
                <ul className="space-y-1">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className={`inline-flex min-h-11 items-center py-2 text-sm text-brand underline underline-offset-4 ${sectionLink}`}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </section>
        ))}
      </article>
      <footer className="mt-10 border-t border-line pt-5">
        <a href="#legal-top" className={`inline-flex min-h-11 items-center text-sm font-semibold text-brand ${sectionLink}`}>{labels.top} ↑</a>
      </footer>
    </main>
  );
}
