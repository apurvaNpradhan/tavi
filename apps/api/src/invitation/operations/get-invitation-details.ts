import { and, eq, sql } from "drizzle-orm";
import db, { schema } from "../../database";

/** Looks up only the fields that are safe to return to someone holding the invite ID. */
export async function getInvitationDetails(invitationId: string) {
  const [invitation] = await db
    .select({
      id: schema.invitationTable.id,
      email: schema.invitationTable.email,
      workspaceName: schema.workspaceTable.name,
      inviterName: schema.userTable.name,
      expiresAt: schema.invitationTable.expiresAt,
    })
    .from(schema.invitationTable)
    .innerJoin(
      schema.workspaceTable,
      eq(schema.invitationTable.workspaceId, schema.workspaceTable.id),
    )
    .innerJoin(schema.userTable, eq(schema.invitationTable.inviterId, schema.userTable.id))
    .where(
      and(
        eq(schema.invitationTable.id, invitationId),
        eq(schema.invitationTable.status, "pending"),
        // Invitation expiry is a database timestamp. Compare it with the same
        // database clock used by the pending-invitation query so API host clock
        // skew cannot make an expired invitation appear valid.
        sql`${schema.invitationTable.expiresAt} > now()`,
      ),
    )
    .limit(1);

  if (!invitation) return { valid: false as const };

  return {
    valid: true as const,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      workspaceName: invitation.workspaceName,
      inviterName: invitation.inviterName,
      expiresAt: invitation.expiresAt,
    },
  };
}

/** Returns the workspace that owns a member row, without trusting a supplied workspace ID. */
export async function getMemberWorkspaceId(memberId: string): Promise<string | null> {
  const [member] = await db
    .select({ workspaceId: schema.workspaceUserTable.workspaceId })
    .from(schema.workspaceUserTable)
    .where(eq(schema.workspaceUserTable.id, memberId))
    .limit(1);

  return member?.workspaceId ?? null;
}

/** Returns the current role and user for a member row. */
export async function getMemberForManagement(memberId: string) {
  const [member] = await db
    .select({
      id: schema.workspaceUserTable.id,
      workspaceId: schema.workspaceUserTable.workspaceId,
      userId: schema.workspaceUserTable.userId,
      role: schema.workspaceUserTable.role,
      joinedAt: schema.workspaceUserTable.joinedAt,
    })
    .from(schema.workspaceUserTable)
    .where(eq(schema.workspaceUserTable.id, memberId))
    .limit(1);

  return member ?? null;
}

/** Checks that a requested role is the immutable owner role or exists in this workspace. */
export async function workspaceHasRole(workspaceId: string, role: string): Promise<boolean> {
  if (role === "owner") return true;

  const [storedRole] = await db
    .select({ role: schema.workspaceRoleTable.role })
    .from(schema.workspaceRoleTable)
    .where(
      and(
        eq(schema.workspaceRoleTable.workspaceId, workspaceId),
        eq(schema.workspaceRoleTable.role, role),
      ),
    )
    .limit(1);

  return Boolean(storedRole);
}
