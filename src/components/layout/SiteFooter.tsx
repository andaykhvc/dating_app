"use client";

import { usePathname } from "next/navigation";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { TABS, isTabActive } from "@/components/layout/nav";

/**
 * Legal links for public, auth and onboarding pages. Inside the app (the tab
 * screens) they are left out so the bottom tab bar stays the last thing on the
 * screen; the same links live in Settings.
 */
export function SiteFooter() {
  const pathname = usePathname();
  if (TABS.some(({ href }) => isTabActive(pathname, href))) return null;

  return (
    <footer className="safe-bottom px-gutter py-4 shadow-[inset_0_0.5px_0_var(--separator)]">
      <LegalLinks />
    </footer>
  );
}
