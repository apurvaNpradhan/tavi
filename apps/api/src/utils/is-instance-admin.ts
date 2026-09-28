import { eq } from "drizzle-orm";
import type { Context } from "hono";
import db, { schema } from "../database";

/**
 * Whether the caller is an instance-wide administrator (`user.role === "admin"`).
 *
 * The role is always read fresh rather than trusted from the session snapshot,
 * which can predate the first-user promotion or an admin's later change.
 */
export async function isInstanceAdmin(c: Context): Promise<boolean> {
  const userId = c.get("userId");
  if (!userId) return false;

  return isAdministratorUserId(userId);
}

/**
 * Whether the given user id is an instance-wide administrator.
 *
 * The role is always read fresh rather than trusted from the session snapshot,
 * which can predate the first-user promotion or an admin's later change. The
 * transport-free form lets the oRPC middleware share the same rule.
 */
export async function isAdministratorUserId(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ role: schema.userTable.role })
    .from(schema.userTable)
    .where(eq(schema.userTable.id, userId))
    .limit(1);

  return user?.role === "admin";
}
