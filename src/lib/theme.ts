/**
 * Appearance preference: "system" follows the OS; "light" and "dark" force a
 * side via data-theme on <html>. Stored in localStorage only (it is a
 * per-device convenience), and applied by a blocking inline script before first
 * paint (see THEME_INIT_SCRIPT and the root layout).
 */
export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "lm.theme";

/** Browser-chrome colours; keep in sync with the surface tokens in globals.css. */
export const THEME_COLORS = { light: "#faf7f2", dark: "#0f0e14" } as const;

export function parseThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

/** The <meta name="theme-color"> colour for a preference on a given OS scheme. */
export function themeColorFor(
  preference: ThemePreference,
  osScheme: "light" | "dark",
): string {
  return THEME_COLORS[preference === "system" ? osScheme : preference];
}

/**
 * Runs in <head> before anything paints, so a saved choice never flashes the
 * wrong theme. localStorage can throw (private mode, blocked storage): the
 * try/catch leaves the page on System in that case.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

// Only used when localStorage is unavailable, so the control still reflects the
// choice made in this page's lifetime.
let fallbackPreference: ThemePreference = "system";

export function readThemePreference(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return fallbackPreference;
  }
}

/** Applies a preference to the document: attribute and browser-chrome colour. */
export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", preference);

  // Next renders one theme-color tag per OS scheme. With an explicit choice both
  // get the chosen colour; on System each goes back to its own scheme's colour.
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      const osScheme = meta.media.includes("dark") ? "dark" : "light";
      meta.content = themeColorFor(preference, osScheme);
    });
}

const listeners = new Set<() => void>();

export function setThemePreference(preference: ThemePreference): void {
  fallbackPreference = preference;
  try {
    if (preference === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Not persisted; the choice still applies until the page is closed.
  }
  applyThemePreference(preference);
  listeners.forEach((l) => l());
}

export function subscribeThemePreference(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getServerThemePreference(): ThemePreference {
  return "system";
}
