/**
 * The address a sign-up code was sent to, kept for the verify screen. It lives
 * in sessionStorage (this tab only, gone when it closes) rather than the URL,
 * so an email address never ends up in history, logs or a shared link. Storage
 * can be blocked, so every access is guarded and the screen can ask for the
 * address instead.
 */
const KEY = "pending-signup-email";

export function rememberPendingEmail(email: string) {
  try {
    sessionStorage.setItem(KEY, email);
  } catch {
    // Blocked storage: the verify screen asks for the address.
  }
}

export function readPendingEmail(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function forgetPendingEmail() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}
