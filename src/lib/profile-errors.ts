/** Shown when the database refuses a profile name (see 99998_name_moderation.sql). */
export const NAME_NOT_ALLOWED_MESSAGE =
  "That name can't be used. Please use the name you'd like people to call you.";

/**
 * The database raises the stable text NAME_NOT_ALLOWED when a name is refused;
 * it deliberately never says which word matched. Anything else passes through.
 */
export function profileErrorMessage(message: string): string {
  return message.includes("NAME_NOT_ALLOWED") ? NAME_NOT_ALLOWED_MESSAGE : message;
}
