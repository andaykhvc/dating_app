/**
 * Where people write to us. Set NEXT_PUBLIC_SUPPORT_EMAIL (see README); until
 * it is set the support page says so instead of showing a made-up address.
 */
export const SUPPORT_EMAIL: string | null =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null;
