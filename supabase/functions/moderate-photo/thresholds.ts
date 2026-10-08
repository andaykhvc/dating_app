/**
 * Every tunable number in one place. Scores are the provider's confidence
 * (0-100) for a top-level category; see docs/moderation.md for how to tune them
 * from the shadow log.
 *
 * Policy: clear nudity or sexual content is rejected; borderline cases wait for
 * a person; everything else (including ordinary swimwear and beach photos, which
 * are normal on a dating profile) is approved.
 */

/** Rejected outright at or above this. */
export const REJECT_AT: Record<string, number> = {
  "Explicit Nudity": 85,
  "Explicit": 85, // older taxonomy name
};

/** Not auto-approved at or above this; a human decides. */
export const REVIEW_AT: Record<string, number> = {
  "Explicit Nudity": 50,
  "Explicit": 50,
  "Non-Explicit Nudity of Intimate parts and Kissing": 60,
  "Violence": 70,
  "Visually Disturbing": 70,
  "Hate Symbols": 70,
  "Drugs & Tobacco": 85,
};

/** Reason shown to the user for an automatic rejection. */
export const REJECT_REASON = "Nudity or sexual content";

/** Only labels at or above this confidence are asked for / considered. */
export const MIN_CONFIDENCE = 40;

/** Photos larger than this are not sent to the provider (the bucket allows 2 MB). */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Provider calls per user per rolling 24 hours; over the cap stays pending. */
export const MAX_CALLS_PER_USER_PER_DAY = 20;
