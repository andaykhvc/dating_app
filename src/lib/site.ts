/**
 * The public origin of the site: the one place that knows which domain the app
 * lives on. Set NEXT_PUBLIC_SITE_URL (e.g. https://example.com) once the app
 * has its own domain; see docs/domain-setup.md.
 *
 * Unset, absolute URLs fall back to the origin of the current request or page
 * (so preview deployments and phones on a LAN still work), then to Vercel's
 * production host when building there, and to http://localhost:3000 in dev.
 */
const DEV_FALLBACK = "http://localhost:3000";

/** An http(s) origin without a trailing slash, or null if the value is not one. */
export function normalizeSiteUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function siteUrl(fallbackOrigin?: string): string {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(fallbackOrigin) ??
    normalizeSiteUrl(vercelHost && `https://${vercelHost}`) ??
    DEV_FALLBACK
  );
}

/** Where auth emails and OAuth providers send people back to. Browser only. */
export function authCallbackUrl(next?: string): string {
  const base = `${siteUrl(window.location.origin)}/auth/callback`;
  return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}
