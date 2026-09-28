import { createId } from "@paralleldrive/cuid2";
import { beforeEach, describe, expect, it } from "vitest";
import { getDatabasePool } from "../../apps/api/src/database";
import { hasWorkspacePermission } from "../../apps/api/src/utils/require-workspace-permission";
import { validateWorkspaceAccess } from "../../apps/api/src/utils/validate-workspace-access";
import { addMember, createUser, createWorkspace, truncateAllTables } from "./helpers/db";
import { fakeContext } from "./helpers/context";

async function setRoleRow(workspaceId: string, role: string, permission: string): Promise<void> {
  await getDatabasePool().query(
    `insert into workspace_role (id, workspace_id, role, permission, created_at, updated_at)
     values ($1, $2, $3, $4, now(), now())`,
    [createId(), workspaceId, role, permission],
  );
}

describe("validateWorkspaceAccess", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("allows a member", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();
    await addMember(workspaceId, user.id, "member");
    await setRoleRow(workspaceId, "member", JSON.stringify({ workspace: ["read"] }));

    await expect(validateWorkspaceAccess(user.id, workspaceId)).resolves.toBeUndefined();
  });

  it("denies a non-member", async () => {
    const workspaceId = await createWorkspace();
    const outsider = await createUser();

    await expect(validateWorkspaceAccess(outsider.id, workspaceId)).rejects.toThrow(
      /do not have access/i,
    );
  });

  it("denies access to a workspace that does not exist", async () => {
    const user = await createUser();

    await expect(validateWorkspaceAccess(user.id, "does-not-exist")).rejects.toThrow(
      /do not have access/i,
    );
  });
});

describe("hasWorkspacePermission", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("grants a capability the member's role includes", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();
    await addMember(workspaceId, user.id, "member");
    await setRoleRow(workspaceId, "member", JSON.stringify({ workspace: ["read"] }));

    const allowed = await hasWorkspacePermission(fakeContext({ userId: user.id, workspaceId }), {
      workspace: ["read"],
    });

    expect(allowed).toBe(true);
  });

  it("denies a capability the member's role lacks", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();
    await addMember(workspaceId, user.id, "viewer");

    const allowed = await hasWorkspacePermission(fakeContext({ userId: user.id, workspaceId }), {
      workspace: ["delete"],
    });

    expect(allowed).toBe(false);
  });

  it("denies a user with no membership", async () => {
    const workspaceId = await createWorkspace();
    const outsider = await createUser();

    const allowed = await hasWorkspacePermission(
      fakeContext({ userId: outsider.id, workspaceId }),
      { workspace: ["read"] },
    );

    expect(allowed).toBe(false);
  });

  it("lets a workspace_role row override the built-in defaults", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();
    await addMember(workspaceId, user.id, "viewer");

    // A viewer normally cannot delete; an administrator may widen the role.
    await setRoleRow(workspaceId, "viewer", JSON.stringify({ workspace: ["read", "delete"] }));

    const allowed = await hasWorkspacePermission(fakeContext({ userId: user.id, workspaceId }), {
      workspace: ["delete"],
    });

    expect(allowed).toBe(true);
  });

  it("denies a non-owner when its editable role row is missing", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();
    await addMember(workspaceId, user.id, "member");

    await getDatabasePool().query(
      `delete from workspace_role where workspace_id = $1 and role = 'member'`,
      [workspaceId],
    );

    await expect(
      hasWorkspacePermission(fakeContext({ userId: user.id, workspaceId }), {
        workspace: ["read"],
      }),
    ).resolves.toBe(false);
  });

  it("denies a non-owner when its editable role row is malformed", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();
    await addMember(workspaceId, user.id, "member");

    // Corrupt JSON must deny access, and must not crash the check.
    await setRoleRow(workspaceId, "member", "{not json");

    const allowed = await hasWorkspacePermission(fakeContext({ userId: user.id, workspaceId }), {
      workspace: ["read"],
    });

    expect(allowed).toBe(false);
  });

  it("keeps static owner permissions without an editable role row", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();
    await addMember(workspaceId, user.id, "owner");

    await expect(
      hasWorkspacePermission(fakeContext({ userId: user.id, workspaceId }), {
        workspace: ["read"],
      }),
    ).resolves.toBe(true);
  });

  it("rejects the entire role payload if any action list is malformed", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();
    await addMember(workspaceId, user.id, "viewer");

    await setRoleRow(
      workspaceId,
      "viewer",
      JSON.stringify({ workspace: ["read"], team: "create" }),
    );

    const allowed = await hasWorkspacePermission(fakeContext({ userId: user.id, workspaceId }), {
      workspace: ["read"],
    });

    expect(allowed).toBe(false);
  });

  it("lets an instance administrator bypass workspace roles", async () => {
    const workspaceId = await createWorkspace();
    const admin = await createUser({ role: "admin" });

    const allowed = await hasWorkspacePermission(fakeContext({ userId: admin.id, workspaceId }), {
      workspace: ["delete"],
    });

    expect(allowed).toBe(true);
  });

  it("never lets an API key widen its owner's access", async () => {
    const workspaceId = await createWorkspace();
    const user = await createUser();
    await addMember(workspaceId, user.id, "member");

    const allowed = await hasWorkspacePermission(
      fakeContext({
        userId: user.id,
        workspaceId,
        apiKey: {
          id: "key-1",
          userId: user.id,
          enabled: true,
          permissions: { workspace: ["read"] },
        },
      }),
      { workspace: ["delete"] },
    );

    expect(allowed).toBe(false);
  });
});
