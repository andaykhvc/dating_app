/** The word a person types to confirm deleting their account. */
export const DELETE_CONFIRMATION_WORD = "DELETE";

export function isDeleteConfirmed(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as { confirm?: unknown }).confirm === DELETE_CONFIRMATION_WORD
  );
}

/**
 * A browser POST to our own site carries an Origin header naming our own host.
 * Requiring it (together with the SameSite session cookie) stops another site
 * from triggering a deletion with the visitor's cookies.
 */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
