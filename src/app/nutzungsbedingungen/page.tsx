import { LegalPage } from "@/components/legal/LegalPage";
import { termsDe } from "@/content/legal/terms.de";
import { legalMetadata } from "@/content/legal/metadata";

export const metadata = legalMetadata(termsDe);

export default function NutzungsbedingungenPage() {
  return <LegalPage policy={termsDe} />;
}
