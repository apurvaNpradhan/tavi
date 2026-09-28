import { and, eq } from "drizzle-orm";
import db, { schema } from "../../database";

/** Reads a team's workspace id for resource-based authorization. */
export async function getTeamWorkspaceId(teamId: string): Promise<string | null> {
  const [team] = await db
    .select({ workspaceId: schema.teamTable.workspaceId })
    .from(schema.teamTable)
    .where(eq(schema.teamTable.id, teamId))
    .limit(1);

  return team?.workspaceId ?? null;
}

/** Reads the non-sensitive fields exposed by the team summary procedure. */
export async function getTeamSummary(
  teamId: string,
  authorizedWorkspaceId: string,
): Promise<{ id: string; name: string; createdAt: Date } | undefined> {
  const [team] = await db
    .select({
      id: schema.teamTable.id,
      name: schema.teamTable.name,
      createdAt: schema.teamTable.createdAt,
    })
    .from(schema.teamTable)
    .where(
      and(eq(schema.teamTable.id, teamId), eq(schema.teamTable.workspaceId, authorizedWorkspaceId)),
    )
    .limit(1);

  return team;
}
