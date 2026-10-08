import { LegalPage } from "@/components/legal/LegalPage";
import { imprintDe } from "@/content/legal/imprint.de";
import { legalMetadata } from "@/content/legal/metadata";

export const metadata = legalMetadata(imprintDe);

export default function ImpressumPage() {
  return <LegalPage policy={imprintDe} />;
}
