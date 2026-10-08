import { LegalPage } from "@/components/legal/LegalPage";
import { privacyEn } from "@/content/legal/privacy.en";
import { privacyMetadata } from "@/content/legal/metadata";

export const metadata = privacyMetadata(privacyEn);

export default function PrivacyPage() {
  return <LegalPage policy={privacyEn} />;
}
