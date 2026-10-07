/**
 * Accepts a post-login destination only if it is a plain path on this site.
 *
 * `next` arrives from the query string, so anything is possible. A bare
 * `startsWith("/")` still lets `//evil.com` through (browsers read it as
 * another site), and building `${origin}${next}` lets `@evil.com` or
 * `.evil.com` turn the host into `app.com@evil.com` / `app.com.evil.com`.
 * Anything that is not an unambiguous same-site path falls back.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string,
): string {
  if (!next || !next.startsWith("/")) return fallback;
  // "//host" and "/\host" are protocol-relative; tab, newline and backslash
  // are dropped or rewritten by URL parsers, which can turn "/<tab>/host" into
  // "//host" after the check.
  if (next.startsWith("//") || /[\u0000-\u001f\u007f\\]/.test(next)) {
    return fallback;
  }
  try {
    const base = "http://same-site.invalid";
    if (new URL(next, base).origin !== base) return fallback;
  } catch {
    return fallback;
  }
  return next;
}
