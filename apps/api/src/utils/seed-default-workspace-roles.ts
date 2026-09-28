import { DEFAULT_ROLE_NAMES, defaultRolePayloads } from "@tavi/permissions";
import { eq } from "drizzle-orm";
import db, { schema } from "../database";

/**
 * Backfills the editable default roles for every workspace.
 *
 * Workspace creation seeds these in an `afterCreateOrganization` hook, but an
 * install that predates the seeding (or whose seed failed) would otherwise have
 * members whose role resolves to nothing. Running this at boot is the
 * belt-and-braces path; it is idempotent and cheap because it only inserts
 * missing rows.
 *
 * The read is an optimisation, not the guard: `onConflictDoNothing` against the
 * `(workspace_id, role)` unique index means a concurrent seed — two processes
 * booting at once, or a workspace created while this runs — still inserts each
 * role exactly once. The read alone would be racy.
 */
export async function seedDefaultWorkspaceRoles(): Promise<void> {
  const workspaces = await db.select({ id: schema.workspaceTable.id }).from(schema.workspaceTable);

  let inserted = 0;

  for (const workspace of workspaces) {
    const existing = await db
      .select({ role: schema.workspaceRoleTable.role })
      .from(schema.workspaceRoleTable)
      .where(eq(schema.workspaceRoleTable.workspaceId, workspace.id));

    const taken = new Set(existing.map((row) => row.role));
    const now = new Date();

    const rows = DEFAULT_ROLE_NAMES.filter((name) => !taken.has(name)).map((name) => ({
      workspaceId: workspace.id,
      role: name,
      permission: JSON.stringify(defaultRolePayloads[name]),
      createdAt: now,
      updatedAt: now,
    }));

    if (rows.length > 0) {
      const created = await db
        .insert(schema.workspaceRoleTable)
        .values(rows)
        .onConflictDoNothing({
          target: [schema.workspaceRoleTable.workspaceId, schema.workspaceRoleTable.role],
        })
        .returning({ id: schema.workspaceRoleTable.id });

      inserted += created.length;
    }
  }

  if (inserted > 0) {
    console.log(`🔐 Backfilled ${inserted} default workspace role(s)`);
  }
}
