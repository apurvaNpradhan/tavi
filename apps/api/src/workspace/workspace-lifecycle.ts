import { DEFAULT_ROLE_NAMES, defaultRolePayloads } from "@tavi/permissions";
import db, { schema } from "../database";
import { publishEvent } from "../events";
import completeOnboardingWithWorkspace from "../user/operations/complete-onboarding";

/** Inputs from Better Auth needed to complete workspace creation policy. */
export type WorkspaceCreationLifecycleInput = {
  workspaceId: string;
  workspaceName: string;
  creatorUserId: string;
};

async function seedWorkspaceCreationRoles(workspaceId: string): Promise<void> {
  const now = new Date();

  await db
    .insert(schema.workspaceRoleTable)
    .values(
      DEFAULT_ROLE_NAMES.map((role) => ({
        workspaceId,
        role,
        permission: JSON.stringify(defaultRolePayloads[role]),
        createdAt: now,
        updatedAt: now,
      })),
    )
    .onConflictDoNothing({
      target: [schema.workspaceRoleTable.workspaceId, schema.workspaceRoleTable.role],
    });
}

/**
 * Applies workspace creation policy after Better Auth creates the workspace.
 * Role seeding is idempotent, the event is best-effort in-process delivery, and
 * these effects are not one database transaction.
 */
export async function completeWorkspaceCreationLifecycle(
  input: WorkspaceCreationLifecycleInput,
): Promise<void> {
  await seedWorkspaceCreationRoles(input.workspaceId);
  await completeOnboardingWithWorkspace(input.creatorUserId);

  // Notify only after both durable updates have succeeded. This event remains
  // in-process and is not a transactionally delivered message.
  await publishEvent("workspace.created", {
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName,
  });
}
