/** Shared operator facts for privacy pages and the future #41 Impressum. */
export type LegalEntity = {
  name: string | null;
  address: string | null;
  email: string | null;
  privacyEmail: string | null;
  phone: string | null;
  legalForm: string | null;
  representative: string | null;
  commercialRegister: string | null;
  vatId: string | null;
  dataProtectionOfficer: string | null;
};

const value = (input: string | undefined) => input?.trim() || null;

// Name/address were supplied by the owner. Missing facts remain null.
// These are deliberately public contact details, never credentials.
export const LEGAL_ENTITY: LegalEntity = {
  name: value(process.env.NEXT_PUBLIC_LEGAL_NAME) ?? "Anday Sahin Kahveci",
  address: value(process.env.NEXT_PUBLIC_LEGAL_ADDRESS) ?? "Wundtstr. 5\n01217 Dresden\nDeutschland",
  email: value(process.env.NEXT_PUBLIC_LEGAL_EMAIL),
  privacyEmail: value(process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL),
  phone: value(process.env.NEXT_PUBLIC_LEGAL_PHONE),
  legalForm: value(process.env.NEXT_PUBLIC_LEGAL_FORM),
  representative: value(process.env.NEXT_PUBLIC_LEGAL_REPRESENTATIVE),
  commercialRegister: value(process.env.NEXT_PUBLIC_LEGAL_REGISTER),
  vatId: value(process.env.NEXT_PUBLIC_LEGAL_VAT_ID),
  dataProtectionOfficer: value(process.env.NEXT_PUBLIC_LEGAL_DPO),
};

/** Change only after the documented factual and legal review is complete. */
export const LEGAL_DRAFT_MODE = true;

export function missingLegalFields(entity: LegalEntity): string[] {
  return [
    ...(!entity.name ? ["name"] : []),
    ...(!entity.address ? ["address"] : []),
    ...(!entity.email ? ["email"] : []),
  ];
}

export function legalPagesIndexable(entity: LegalEntity, draft: boolean): boolean {
  return !draft && missingLegalFields(entity).length === 0;
}

export function isPrivacyPath(pathname: string): boolean {
  return pathname === "/datenschutz" || pathname === "/privacy";
}

export function legalSiteOrigin(input: string | undefined): string {
  const url = new URL(input?.trim() || "https://dating-app-ruddy.vercel.app");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an http(s) site origin without credentials.");
  }
  return url.origin;
}
