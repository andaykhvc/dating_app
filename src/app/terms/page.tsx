import { LegalPage } from "@/components/legal/LegalPage";
import { termsEn } from "@/content/legal/terms.en";
import { legalMetadata } from "@/content/legal/metadata";

export const metadata = legalMetadata(termsEn);

export default function TermsPage() {
  return <LegalPage policy={termsEn} />;
}
