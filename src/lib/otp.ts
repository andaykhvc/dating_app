/** Length of the sign-up code; must match `otp_length` in supabase/config.toml and the project's Auth settings. */
export const OTP_LENGTH = 6;

/** How long someone waits before asking for another code. */
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * What a person typed or pasted, reduced to the code: digits only, at most
 * OTP_LENGTH of them. Autofill and paste often bring spaces or a dash
 * ("123 456", "123-456").
 */
export function normalizeOtp(input: string): string {
  return input.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function isCompleteOtp(code: string): boolean {
  return code.length === OTP_LENGTH && /^\d+$/.test(code);
}

/** Whole seconds left until `until` (epoch ms), never negative. */
export function secondsLeft(until: number, now: number): number {
  return Math.max(0, Math.ceil((until - now) / 1000));
}

/** Plain-language versions of what Supabase says when a code does not work. */
export function otpErrorMessage(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("expired") || text.includes("invalid")) {
    return "That code is wrong or has expired. Check it, or send a new one.";
  }
  if (text.includes("rate limit") || text.includes("only request this after") || text.includes("too many")) {
    return "Too many tries for now. Wait a minute, then try again.";
  }
  if (text.includes("failed to fetch") || text.includes("network") || text.includes("load failed")) {
    return "Could not reach the server. Check your connection and try again.";
  }
  return message;
}

export function isEmailNotConfirmed(message: string): boolean {
  return message.toLowerCase().includes("email not confirmed");
}
