import { LEGAL_ENTITY, contactFormHref, phoneHref, type LegalEntity } from "@/lib/legal";

const copy = {
  de: {
    name: "Vollständiger Name", address: "Ladungsfähige Anschrift", email: "E-Mail",
    phone: "Telefon", form: "Kontaktformular", second: "Zweiter schneller Kontaktweg",
    operator: "Anbieterform", individual: "Natürliche Person", organization: "Organisation / juristische Person",
    legalForm: "Rechtsform", representative: "Vertretungsberechtigte Person / Anschrift", register: "Register und Registernummer",
    vat: "Umsatzsteuer-Identifikationsnummer", business: "Wirtschafts-Identifikationsnummer",
    regulation: "Zulassung / berufsrechtliche Angaben", authority: "Zuständige Aufsichtsbehörde", profession: "Berufsrechtliche Angaben",
    editorial: "Journalistisch-redaktionelles Angebot", responsible: "Verantwortliche Person nach § 18 Abs. 2 MStV", responsibleAddress: "Anschrift dieser Person",
    missing: "FEHLT — noch nicht bestätigt", applicability: "Anwendbarkeit noch zu bestätigen",
    notRequired: "Nach bestätigter Prüfung für dieses Angebot nicht erforderlich.",
    yes: "Ja — zusätzliche Verantwortlichenangaben erforderlich", no: "Nach bestätigter Prüfung kein solches Angebot",
  },
  en: {
    name: "Full legal name", address: "Physical address for service", email: "Email",
    phone: "Phone", form: "Contact form", second: "Second rapid contact channel",
    operator: "Provider type", individual: "Natural person", organization: "Organization / legal entity",
    legalForm: "Legal form", representative: "Authorized representative / address", register: "Register and registration number",
    vat: "VAT identification number", business: "German business identification number",
    regulation: "Authorization / professional disclosures", authority: "Competent supervisory authority", profession: "Professional disclosures",
    editorial: "Journalistic/editorial offering", responsible: "Person responsible under § 18(2) MStV", responsibleAddress: "That person's address",
    missing: "Not provided or confirmed yet", applicability: "Applicability needs confirmation",
    notRequired: "Confirmed review found this disclosure is not required for this offering.",
    yes: "Yes — responsible-person details required", no: "Confirmed review found no such offering",
  },
};

export function ImprintDetails({ language, entity = LEGAL_ENTITY }: { language: "de" | "en"; entity?: LegalEntity }) {
  const labels = copy[language];
  const phone = phoneHref(entity.phone);
  const form = contactFormHref(entity.contactFormUrl);
  const linkClass = "inline-flex min-h-11 items-center break-all rounded-lg text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";
  const fields: { key: string; label: string; value: string | null; href?: string | null; note?: string }[] = [
    { key: "name", label: labels.name, value: entity.name },
    { key: "address", label: labels.address, value: entity.address },
    { key: "email", label: labels.email, value: entity.email, href: entity.email ? `mailto:${entity.email}` : null },
    { key: "operatorType", label: labels.operator, value: entity.operatorType === "individual" ? labels.individual : entity.operatorType === "organization" ? labels.organization : null },
  ];
  if (entity.phone) fields.push({ key: "phone", label: labels.phone, value: phone ? entity.phone : null, href: phone });
  if (entity.contactFormUrl) fields.push({ key: "contactFormUrl", label: labels.form, value: form, href: form });
  if (!phone && !form) fields.push({ key: "secondContact", label: labels.second, value: null });
  if (entity.operatorType !== "individual") {
    fields.push({ key: "legalForm", label: labels.legalForm, value: entity.legalForm });
    fields.push({ key: "representative", label: labels.representative, value: entity.representative });
  }
  for (const [key, label, flag] of [
    ["commercialRegister", labels.register, entity.registerRequired],
    ["vatId", labels.vat, entity.vatIdRequired],
    ["businessId", labels.business, entity.businessIdRequired],
  ] as const) {
    fields.push({ key, label, value: entity[key] ?? (flag === false ? labels.notRequired : null), note: flag === null ? labels.applicability : undefined });
  }
  if (entity.regulatedActivity === false) fields.push({ key: "regulatedActivity", label: labels.regulation, value: labels.notRequired });
  else {
    if (entity.regulatedActivity === null) fields.push({ key: "regulatedActivity", label: labels.regulation, value: null, note: labels.applicability });
    fields.push({ key: "supervisoryAuthority", label: labels.authority, value: entity.supervisoryAuthority });
    fields.push({ key: "professionalDetails", label: labels.profession, value: entity.professionalDetails });
  }
  fields.push({ key: "editorialContent", label: labels.editorial, value: entity.editorialContent === null ? null : entity.editorialContent ? labels.yes : labels.no });
  if (entity.editorialContent !== false) {
    fields.push({ key: "contentResponsibleName", label: labels.responsible, value: entity.contentResponsibleName });
    fields.push({ key: "contentResponsibleAddress", label: labels.responsibleAddress, value: entity.contentResponsibleAddress });
  }

  return (
    <dl className="mt-5 space-y-5 surface-card p-5 sm:p-6">
      {fields.map((field) => (
        <div key={field.key} className="grid gap-1 sm:grid-cols-[12rem_1fr] sm:gap-5">
          <dt className="text-sm font-semibold leading-6 text-muted">{field.label}</dt>
          <dd className="whitespace-pre-line break-words text-sm leading-6 text-ink">
            {field.value ? field.href ? <a href={field.href} className={linkClass}>{field.value}</a> : field.value : (
              <span data-missing-field={field.key} className="font-semibold text-negative">
                <span lang="en">MISSING</span> — {labels.missing}
              </span>
            )}
            {field.note && <span className="mt-1 block text-muted">{field.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
