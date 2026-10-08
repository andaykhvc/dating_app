"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { readLocaleCookie, writeLocaleCookie } from "./cookie";

/**
 * A browser that has no language cookie yet (a new device after signing in)
 * was served in the account's language by the server. This stores it as the
 * cookie so signed-out pages and <html lang> match too.
 */
export function LocaleSync({ locale }: { locale: Locale }) {
  const router = useRouter();

  useEffect(() => {
    if (readLocaleCookie() === locale) return;
    writeLocaleCookie(locale);
    router.refresh();
  }, [locale, router]);

  return null;
}
