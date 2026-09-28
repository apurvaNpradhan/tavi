import { and, eq, inArray, sql } from "drizzle-orm";
import db, { schema } from "../database";

/**
 * Finds workspaces the user solely owns.
 *
 * Deleting a user must not orphan a workspace that nobody else can administer,
 * so those workspaces are removed with them. Workspaces with other members are
 * left intact — the user simply leaves.
 */
export async function findSolelyOwnedWorkspaces(userId: string): Promise<string[]> {
  const owned = await db
    .select({ workspaceId: schema.workspaceUserTable.workspaceId })
    .from(schema.workspaceUserTable)
    .where(
      and(
        eq(schema.workspaceUserTable.userId, userId),
        eq(schema.workspaceUserTable.role, "owner"),
      ),
    );

  if (owned.length === 0) return [];

  const workspaceIds = owned.map((row) => row.workspaceId);

  const others = await db
    .select({
      workspaceId: schema.workspaceUserTable.workspaceId,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.workspaceUserTable)
    .where(
      and(
        inArray(schema.workspaceUserTable.workspaceId, workspaceIds),
        sql`${schema.workspaceUserTable.userId} <> ${userId}`,
      ),
    )
    .groupBy(schema.workspaceUserTable.workspaceId);

  const shared = new Set(others.map((row) => row.workspaceId));

  return workspaceIds.filter((id) => !shared.has(id));
}
