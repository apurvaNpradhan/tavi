import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../database";

/**
 * Confirms a user belongs to a workspace before any workspace-scoped work runs.
 *
 * This is the single choke point for tenant isolation: every scoped route goes
 * through `workspaceAccess` -> here, so a new route cannot forget the check.
 */
export async function validateWorkspaceAccess(
  userId: string,
  workspaceId: string,
  apiKeyId?: string,
): Promise<void> {
  const [membership] = await db
    .select({ id: schema.workspaceUserTable.id })
    .from(schema.workspaceUserTable)
    .where(
      and(
        eq(schema.workspaceUserTable.workspaceId, workspaceId),
        eq(schema.workspaceUserTable.userId, userId),
      ),
    )
    .limit(1);

  if (membership) return;

  // An API key is scoped to the user that created it; a key whose owner is a
  // member is allowed through so automation can act on their behalf.
  if (apiKeyId) {
    const [key] = await db
      .select({ referenceId: schema.apikeyTable.referenceId })
      .from(schema.apikeyTable)
      .where(eq(schema.apikeyTable.id, apiKeyId))
      .limit(1);

    if (key?.referenceId === userId) {
      const [ownerMembership] = await db
        .select({ id: schema.workspaceUserTable.id })
        .from(schema.workspaceUserTable)
        .where(
          and(
            eq(schema.workspaceUserTable.workspaceId, workspaceId),
            eq(schema.workspaceUserTable.userId, key.referenceId),
          ),
        )
        .limit(1);

      if (ownerMembership) return;
    }
  }

  throw new HTTPException(403, {
    message: "You do not have access to this workspace",
  });
}
