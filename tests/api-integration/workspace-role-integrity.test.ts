import { createId } from "@paralleldrive/cuid2";
import { beforeEach, describe, expect, it } from "vitest";
import db, { getDatabasePool, schema } from "../../apps/api/src/database";
import { seedDefaultWorkspaceRoles } from "../../apps/api/src/utils/seed-default-workspace-roles";
import { addMember, createUser, createWorkspace, truncateAllTables } from "./helpers/db";

/** PostgreSQL's `unique_violation` SQLSTATE. */
const UNIQUE_VIOLATION = "23505";

async function insertRoleRow(
  workspaceId: string,
  role: string,
  permission = "{}",
): Promise<string> {
  const id = createId();
  await getDatabasePool().query(
    `insert into workspace_role (id, workspace_id, role, permission, created_at, updated_at)
     values ($1, $2, $3, $4, now(), now())`,
    [id, workspaceId, role, permission],
  );
  return id;
}

async function countMemberships(workspaceId: string, userId: string): Promise<number> {
  const { rows } = await getDatabasePool().query<{ count: string }>(
    `select count(*)::text as count from workspace_member where workspace_id = $1 and user_id = $2`,
    [workspaceId, userId],
  );
  return Number(rows[0]?.count ?? 0);
}

async function countRoles(workspaceId: string): Promise<number> {
  const { rows } = await getDatabasePool().query<{ count: string }>(
    `select count(*)::text as count from workspace_role where workspace_id = $1`,
    [workspaceId],
  );
  return Number(rows[0]?.count ?? 0);
}

describe("workspace role and membership uniqueness", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("rejects a second membership for the same user and workspace", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();
    await addMember(workspaceId, user.id, "member");

    await expect(addMember(workspaceId, user.id, "admin")).rejects.toMatchObject({
      code: UNIQUE_VIOLATION,
    });

    await expect(countMemberships(workspaceId, user.id)).resolves.toBe(1);
  });

  it("rejects a second definition of the same role name in a workspace", async () => {
    const workspaceId = await createWorkspace();
    await insertRoleRow(workspaceId, "viewer", JSON.stringify({ workspace: ["read"] }));

    await expect(
      insertRoleRow(workspaceId, "viewer", JSON.stringify({ workspace: ["delete"] })),
    ).rejects.toMatchObject({ code: UNIQUE_VIOLATION });

    await expect(countRoles(workspaceId)).resolves.toBe(1);
  });

  it("lets the same role name exist in different workspaces", async () => {
    const first = await createWorkspace();
    const second = await createWorkspace();

    await insertRoleRow(first, "viewer");
    await insertRoleRow(second, "viewer");

    await expect(countRoles(first)).resolves.toBe(1);
    await expect(countRoles(second)).resolves.toBe(1);
  });

  it("seeds each default role exactly once across concurrent backfills", async () => {
    const workspaceId = await createWorkspace();

    // Five boots race an *empty* workspace: each reads no existing roles and
    // tries to insert, so only `onConflictDoNothing` against the unique index
    // keeps every role to a single row.
    await Promise.all(Array.from({ length: 5 }, () => seedDefaultWorkspaceRoles()));

    const seeded = await countRoles(workspaceId);
    expect(seeded).toBeGreaterThan(0);

    const { rows } = await getDatabasePool().query<{ duplicates: string }>(
      `select (count(*) - count(distinct role))::text as duplicates
         from workspace_role where workspace_id = $1`,
      [workspaceId],
    );
    expect(Number(rows[0]?.duplicates ?? "-1")).toBe(0);

    // A later boot is a no-op, not another insert.
    await seedDefaultWorkspaceRoles();
    await expect(countRoles(workspaceId)).resolves.toBe(seeded);
  });

  it("keeps exactly one membership when two inserts race", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();

    const results = await Promise.allSettled([
      addMember(workspaceId, user.id, "member"),
      addMember(workspaceId, user.id, "admin"),
      addMember(workspaceId, user.id, "viewer"),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(2);
    for (const result of rejected) {
      expect((result as PromiseRejectedResult).reason).toMatchObject({ code: UNIQUE_VIOLATION });
    }

    await expect(countMemberships(workspaceId, user.id)).resolves.toBe(1);
  });

  it("allows workspace deletion to cascade through its owner memberships", async () => {
    const workspaceId = await createWorkspace();
    const owner = await createUser();
    await addMember(workspaceId, owner.id, "owner");

    await getDatabasePool().query(`delete from workspace where id = $1`, [workspaceId]);

    await expect(countMemberships(workspaceId, owner.id)).resolves.toBe(0);
  });

  it("rejects direct SQL that would remove or demote the final owner", async () => {
    const workspaceId = await createWorkspace();
    const owner = await createUser();
    await addMember(workspaceId, owner.id, "owner");

    await expect(
      getDatabasePool().query(
        `update workspace_member set role = 'member' where workspace_id = $1 and user_id = $2`,
        [workspaceId, owner.id],
      ),
    ).rejects.toMatchObject({ code: "23514", constraint: "workspace_member_at_least_one_owner" });
    await expect(
      getDatabasePool().query(
        `delete from workspace_member where workspace_id = $1 and user_id = $2`,
        [workspaceId, owner.id],
      ),
    ).rejects.toMatchObject({ code: "23514", constraint: "workspace_member_at_least_one_owner" });

    const { rows } = await getDatabasePool().query<{ role: string }>(
      `select role from workspace_member where workspace_id = $1 and user_id = $2`,
      [workspaceId, owner.id],
    );
    expect(rows).toEqual([{ role: "owner" }]);
  });

  it("refuses duplicate role rows inserted through the ORM conflict path", async () => {
    const workspaceId = await createWorkspace();
    const now = new Date();

    await db
      .insert(schema.workspaceRoleTable)
      .values([
        { workspaceId, role: "viewer", permission: "{}", createdAt: now, updatedAt: now },
        {
          workspaceId,
          role: "viewer",
          permission: '{"workspace":["delete"]}',
          createdAt: now,
          updatedAt: now,
        },
      ])
      .onConflictDoNothing({
        target: [schema.workspaceRoleTable.workspaceId, schema.workspaceRoleTable.role],
      });

    await expect(countRoles(workspaceId)).resolves.toBe(1);
  });
});
