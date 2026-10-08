import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";
import { guidelines } from "@/content/info/guidelines";
import { pickLocale } from "@/content/info/types";

export const metadata: Metadata = { title: "Community guidelines" };

export default async function GuidelinesPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const locale = pickLocale((await searchParams).lang);
  return (
    <InfoPage
      content={guidelines}
      locale={locale}
      path="/guidelines"
      links={[{ href: "/support", label: { en: "Help & safety", de: "Hilfe & Sicherheit" } }]}
    />
  );
}
