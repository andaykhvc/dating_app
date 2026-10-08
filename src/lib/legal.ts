/** Shared public operator facts for every legal page. Null means unconfirmed. */
export type LegalEntity = {
  name: string | null;
  address: string | null;
  email: string | null;
  privacyEmail: string | null;
  phone: string | null;
  contactFormUrl: string | null;
  operatorType: "individual" | "organization" | null;
  legalForm: string | null;
  representative: string | null;
  commercialRegister: string | null;
  vatId: string | null;
  businessId: string | null;
  registerRequired: boolean | null;
  vatIdRequired: boolean | null;
  businessIdRequired: boolean | null;
  regulatedActivity: boolean | null;
  supervisoryAuthority: string | null;
  professionalDetails: string | null;
  editorialContent: boolean | null;
  contentResponsibleName: string | null;
  contentResponsibleAddress: string | null;
  dataProtectionOfficer: string | null;
};

type LegalValues = Partial<Record<keyof LegalEntity, string>>;
const value = (input: string | undefined, fallback: string | null = null) =>
  input === undefined ? fallback : input.trim() || null;
const confirmedBoolean = (input: string | undefined) => input === "true" ? true : input === "false" ? false : null;

/** Empty overrides intentionally clear a field; only absent values use owner facts. */
export function legalEntityFromValues(values: LegalValues): LegalEntity {
  const operatorType = value(values.operatorType, "individual");
  return {
    name: value(values.name, "Anday Sahin Kahveci"),
    address: value(values.address, "Wundtstr. 5\n01217 Dresden\nDeutschland"),
    email: value(values.email, "contact@linguamatch.online"),
    privacyEmail: value(values.privacyEmail),
    phone: value(values.phone, "+491782943998"),
    contactFormUrl: value(values.contactFormUrl),
    operatorType: operatorType === "individual" || operatorType === "organization" ? operatorType : null,
    legalForm: value(values.legalForm),
    representative: value(values.representative),
    commercialRegister: value(values.commercialRegister),
    vatId: value(values.vatId),
    businessId: value(values.businessId),
    registerRequired: confirmedBoolean(values.registerRequired),
    vatIdRequired: confirmedBoolean(values.vatIdRequired),
    businessIdRequired: confirmedBoolean(values.businessIdRequired),
    regulatedActivity: confirmedBoolean(values.regulatedActivity),
    supervisoryAuthority: value(values.supervisoryAuthority),
    professionalDetails: value(values.professionalDetails),
    editorialContent: confirmedBoolean(values.editorialContent),
    contentResponsibleName: value(values.contentResponsibleName),
    contentResponsibleAddress: value(values.contentResponsibleAddress),
    dataProtectionOfficer: value(values.dataProtectionOfficer),
  };
}

// Name/address/email/phone were supplied by the owner. Missing facts remain null.
// These are deliberately public contact details, never credentials.
// Explicit env references are needed for Next's public build-time substitution.
export const LEGAL_ENTITY: LegalEntity = legalEntityFromValues({
  name: process.env.NEXT_PUBLIC_LEGAL_NAME,
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS,
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL,
  privacyEmail: process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL,
  phone: process.env.NEXT_PUBLIC_LEGAL_PHONE,
  contactFormUrl: process.env.NEXT_PUBLIC_LEGAL_CONTACT_FORM_URL,
  operatorType: process.env.NEXT_PUBLIC_LEGAL_OPERATOR_TYPE,
  legalForm: process.env.NEXT_PUBLIC_LEGAL_FORM,
  representative: process.env.NEXT_PUBLIC_LEGAL_REPRESENTATIVE,
  commercialRegister: process.env.NEXT_PUBLIC_LEGAL_REGISTER,
  vatId: process.env.NEXT_PUBLIC_LEGAL_VAT_ID,
  businessId: process.env.NEXT_PUBLIC_LEGAL_BUSINESS_ID,
  registerRequired: process.env.NEXT_PUBLIC_LEGAL_REGISTER_REQUIRED,
  vatIdRequired: process.env.NEXT_PUBLIC_LEGAL_VAT_ID_REQUIRED,
  businessIdRequired: process.env.NEXT_PUBLIC_LEGAL_BUSINESS_ID_REQUIRED,
  regulatedActivity: process.env.NEXT_PUBLIC_LEGAL_REGULATED_ACTIVITY,
  supervisoryAuthority: process.env.NEXT_PUBLIC_LEGAL_SUPERVISORY_AUTHORITY,
  professionalDetails: process.env.NEXT_PUBLIC_LEGAL_PROFESSIONAL_DETAILS,
  editorialContent: process.env.NEXT_PUBLIC_LEGAL_EDITORIAL_CONTENT,
  contentResponsibleName: process.env.NEXT_PUBLIC_LEGAL_CONTENT_RESPONSIBLE_NAME,
  contentResponsibleAddress: process.env.NEXT_PUBLIC_LEGAL_CONTENT_RESPONSIBLE_ADDRESS,
  dataProtectionOfficer: process.env.NEXT_PUBLIC_LEGAL_DPO,
});

/** Change only after the documented factual and legal review is complete. */
// Only an explicit false disables the banner; absent/invalid values fail closed.
export const LEGAL_DRAFT_MODE = process.env.NEXT_PUBLIC_LEGAL_DRAFT_MODE !== "false";

export const LEGAL_DOCUMENT_PATHS = {
  privacy: { de: "/datenschutz", en: "/privacy" },
  terms: { de: "/nutzungsbedingungen", en: "/terms" },
  imprint: { de: "/impressum", en: "/imprint" },
} as const;

export function missingLegalFields(entity: LegalEntity): string[] {
  return [
    ...(!entity.name ? ["name"] : []),
    ...(!entity.address ? ["address"] : []),
    ...(!entity.email ? ["email"] : []),
  ];
}

export function contactFormHref(input: string | null): string | null {
  if (!input) return null;
  try {
    const url = new URL(input);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function phoneHref(input: string | null): string | null {
  if (!input || !/^\+?[\d\s()./-]+$/.test(input)) return null;
  const number = input.replace(/[^\d+]/g, "");
  return /^\+?\d{6,15}$/.test(number) ? `tel:${number}` : null;
}

/** Technical release gate, not a determination of legal applicability. */
export function imprintFieldIssues(entity: LegalEntity): string[] {
  const issues = missingLegalFields(entity);
  if (entity.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entity.email)) issues.push("email (invalid)");
  if (entity.address && /\b(?:Postfach|P\.?\s*O\.?\s*Box)\b/i.test(entity.address)) issues.push("address (P.O. box)");
  if (!phoneHref(entity.phone) && !contactFormHref(entity.contactFormUrl)) issues.push("phone or contactFormUrl");
  if (entity.phone && !phoneHref(entity.phone)) issues.push("phone (invalid)");
  if (entity.contactFormUrl && !contactFormHref(entity.contactFormUrl)) issues.push("contactFormUrl (valid HTTPS URL required)");
  if (!entity.operatorType) issues.push("operatorType");
  if (entity.operatorType === "organization") {
    if (!entity.legalForm) issues.push("legalForm");
    if (!entity.representative) issues.push("representative");
  }
  for (const [flag, field] of [
    ["registerRequired", "commercialRegister"], ["vatIdRequired", "vatId"], ["businessIdRequired", "businessId"],
  ] as const) {
    if (entity[flag] === null) issues.push(`${flag} (confirm applicability)`);
    else if (entity[flag] && !entity[field]) issues.push(field);
  }
  if (entity.regulatedActivity === null) issues.push("regulatedActivity (confirm applicability)");
  else if (entity.regulatedActivity) {
    if (!entity.supervisoryAuthority) issues.push("supervisoryAuthority");
    if (!entity.professionalDetails) issues.push("professionalDetails");
  }
  if (entity.editorialContent === null) issues.push("editorialContent (confirm applicability)");
  else if (entity.editorialContent) {
    if (!entity.contentResponsibleName) issues.push("contentResponsibleName");
    if (!entity.contentResponsibleAddress) issues.push("contentResponsibleAddress");
  }
  return issues;
}

export function legalReleaseIssues(entity: LegalEntity, draft: boolean): string[] {
  return [...imprintFieldIssues(entity), ...(draft ? ["LEGAL_DRAFT_MODE (legal review pending)"] : [])];
}

export function legalPagesIndexable(entity: LegalEntity, draft: boolean): boolean {
  return !draft && missingLegalFields(entity).length === 0;
}

export function isPrivacyPath(pathname: string): boolean {
  return Object.values(LEGAL_DOCUMENT_PATHS.privacy).some((path) => path === pathname);
}

export function isPublicLegalPath(pathname: string): boolean {
  return Object.values(LEGAL_DOCUMENT_PATHS).some((paths) =>
    Object.values(paths).some((path) => path === pathname),
  );
}

export function legalSiteOrigin(input: string | undefined): string {
  const url = new URL(input?.trim() || "https://dating-app-ruddy.vercel.app");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an http(s) site origin without credentials.");
  }
  return url.origin;
}
