/**
 * Device authorization helpers, shared by the two `/device` routes.
 *
 * The flow is Better Auth's device-authorization plugin: a CLI or app asks the
 * API for a code, the user enters it here, and approving it binds that client to
 * this account's session.
 */

/**
 * Codes are shown grouped (`ABCD-1234`) and stored ungrouped, so the same code
 * reaches the server whether the user typed the dash, pasted the grouped form,
 * or copied it out of the URL.
 */
export function normalizeUserCode(value: unknown): string {
  return typeof value === "string" ? value.replace(/[^0-9a-z]/gi, "").toUpperCase() : "";
}

/**
 * The shortest code worth sending.
 *
 * Better Auth generates 8 characters by default and strips dashes before
 * comparing, so anything shorter than this cannot match. Checking locally keeps
 * an obvious typo from costing a request — the server is still the authority on
 * whether a code exists, has expired, or was already used.
 */
export const MIN_USER_CODE_LENGTH = 4;

export function isSubmittableUserCode(normalized: string): boolean {
  return normalized.length >= MIN_USER_CODE_LENGTH;
}

/**
 * The server's own explanation for a failed `device` / `approve` / `deny` call.
 *
 * The plugin answers with an OAuth-style `error_description` (for example
 * "user code has expired"), which is more specific than anything the UI could
 * guess. It is untranslated server copy, so callers show it as supporting detail
 * under a translated headline rather than as the message itself.
 */
export function deviceErrorDescription(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;

  const { error_description: description } = error as { error_description?: unknown };
  return typeof description === "string" && description.length > 0 ? description : null;
}
