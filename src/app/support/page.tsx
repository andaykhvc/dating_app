import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";
import { support } from "@/content/info/support";
import { pickLocale } from "@/content/info/types";

export const metadata: Metadata = { title: "Help & safety" };

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const locale = pickLocale((await searchParams).lang);
  return (
    <InfoPage
      content={support}
      locale={locale}
      path="/support"
      showContact
      links={[{ href: "/guidelines", label: { en: "Community guidelines", de: "Community-Regeln" } }]}
    />
  );
}
