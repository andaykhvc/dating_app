import { LegalPage } from "@/components/legal/LegalPage";
import { imprintEn } from "@/content/legal/imprint.en";
import { legalMetadata } from "@/content/legal/metadata";

export const metadata = legalMetadata(imprintEn);

export default function ImprintPage() {
  return <LegalPage policy={imprintEn} />;
}
