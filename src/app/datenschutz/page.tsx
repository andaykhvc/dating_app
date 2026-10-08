import { LegalPage } from "@/components/legal/LegalPage";
import { privacyDe } from "@/content/legal/privacy.de";
import { privacyMetadata } from "@/content/legal/metadata";

export const metadata = privacyMetadata(privacyDe);

export default function DatenschutzPage() {
  return <LegalPage policy={privacyDe} />;
}
