/**
 * Where people write to us. NEXT_PUBLIC_SUPPORT_EMAIL overrides it (see
 * README), for example to point a preview deployment at a test mailbox.
 */
export const SUPPORT_EMAIL: string | null =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "contact@linguamatch.online";
