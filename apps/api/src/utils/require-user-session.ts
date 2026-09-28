import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Returns the authenticated user id or fails with 401.
 *
 * Prefer this over reading `c.get("userId")` directly: an empty string is a
 * plausible value from a misconfigured middleware, and silently treating it as
 * a user id is how tenant checks get bypassed.
 */
export function requireUserId(c: Context): string {
  const userId = c.get("userId");
  if (!userId) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return userId as string;
}
