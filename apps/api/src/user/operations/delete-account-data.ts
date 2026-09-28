import { eq, inArray } from "drizzle-orm";
import db, { schema } from "../../database";
import { findSolelyOwnedWorkspaces } from "../account-deletion";

/**
 * Cleans up everything the schema's cascades cannot.
 *
 * Runs inside Better Auth's `beforeDelete` hook, while the user row still
 * exists. Foreign keys already cascade sessions, accounts, memberships and API
 * keys; what remains is data whose lifetime is a product decision rather than a
 * referential constraint: workspaces the user solely owns would otherwise be
 * unadministrable.
 */
async function deleteAccountData(userId: string): Promise<void> {
  const solelyOwned = await findSolelyOwnedWorkspaces(userId);

  if (solelyOwned.length > 0) {
    // Cascades to roles, members, invitations and teams in those workspaces.
    await db.delete(schema.workspaceTable).where(inArray(schema.workspaceTable.id, solelyOwned));
  }

  await db.delete(schema.userAvatarTable).where(eq(schema.userAvatarTable.userId, userId));
}

export default deleteAccountData;
