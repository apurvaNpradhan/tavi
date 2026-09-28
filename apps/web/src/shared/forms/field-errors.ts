/**
 * Reads messages out of `field.state.meta.errors`.
 *
 * TanStack Form stores a validator's output verbatim. A Standard Schema
 * validator (Zod) yields `{ message }` issues, while a plain function validator
 * can yield a bare string. This keeps the render path from stringifying an
 * issue into `[object Object]`, and drops anything it does not recognise.
 */
export function fieldErrorMessages(errors: unknown): string[] {
  if (!Array.isArray(errors)) return [];

  return errors.flatMap((error) => {
    if (typeof error === "string") return [error];
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return [error.message];
    }
    return [];
  });
}
