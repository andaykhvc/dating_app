"use client";

import { useEffect } from "react";
import { applyThemePreference, readThemePreference } from "@/lib/theme";

/**
 * The inline script in the root layout sets data-theme before paint; this
 * brings the browser-chrome colour (<meta name="theme-color">) in line with it
 * once the tags exist, and re-applies both after React remounts <html> in dev.
 */
export function ThemeSync() {
  useEffect(() => {
    applyThemePreference(readThemePreference());
  }, []);
  return null;
}
