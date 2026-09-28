import { createId } from "@paralleldrive/cuid2";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";
import { subscribeToEvent } from "../../apps/api/src/events";
import { getDatabasePool } from "../../apps/api/src/database";
import { addMember, createUser, createWorkspace, truncateAllTables } from "./helpers/db";

const { app } = createApp();

async function createSession(userId: string): Promise<string> {
  const token = `${createId()}${createId()}`;
  await getDatabasePool().query(
    `insert into "session" (id, token, user_id, expires_at, created_at, updated_at)
     values ($1, $2, $3, now() + interval '1 day', now(), now())`,
    [createId(), token, userId],
  );
  return token;
}

async function seedInvitation(options: {
  workspaceId: string;
  inviterId: string;
  email: string;
  status?: string;
  expiresAt?: Date;
}): Promise<string> {
  const invitationId = createId();
  await getDatabasePool().query(
    `insert into invitation (id, workspace_id, email, role, status, expires_at, inviter_id)
     values ($1, $2, $3, 'member', $4,
       coalesce($5::timestamptz, now() + interval '1 day'), $6)`,
    [
      invitationId,
      options.workspaceId,
      options.email.toLowerCase(),
      options.status ?? "pending",
      options.expiresAt ?? null,
      options.inviterId,
    ],
  );
  return invitationId;
}

async function seedRole(workspaceId: string, role: string): Promise<void> {
  await getDatabasePool().query(
    `insert into workspace_role (id, workspace_id, role, permission, created_at, updated_at)
     values ($1, $2, $3, '{}', now(), now())`,
    [createId(), workspaceId, role],
  );
}

describe("workspace invitations and membership", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("returns only minimal public details for a valid invitation ID", async () => {
    const inviter = await createUser({ name: "Workspace Owner" });
    const workspaceId = await createWorkspace("Private Workspace");
    const invitationId = await seedInvitation({
      workspaceId,
      inviterId: inviter.id,
      email: "invitee@example.com",
    });

    const response = await app.request(`/api/invitation/${invitationId}`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      valid: true,
      invitation: {
        id: invitationId,
        email: "invitee@example.com",
        workspaceName: "Private Workspace",
        inviterName: "Workspace Owner",
      },
    });
    expect(body.invitation).not.toHaveProperty("workspaceId");
    expect(body.invitation).not.toHaveProperty("inviterId");
    expect(body.invitation).not.toHaveProperty("role");
  });

  it("does not disclose details for an expired, canceled, or unknown invitation", async () => {
    const inviter = await createUser();
    const workspaceId = await createWorkspace();
    const expiredId = await seedInvitation({
      workspaceId,
      inviterId: inviter.id,
      email: "expired@example.com",
      expiresAt: new Date(Date.now() - 60_000),
    });
    const canceledId = await seedInvitation({
      workspaceId,
      inviterId: inviter.id,
      email: "canceled@example.com",
      status: "canceled",
    });

    for (const id of [expiredId, canceledId, createId()]) {
      const response = await app.request(`/api/invitation/${id}`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ valid: false });
    }
  });

  it("lists only the signed-in account's pending, unexpired invitations", async () => {
    const invitee = await createUser({ email: "recipient@example.com" });
    await getDatabasePool().query(`update "user" set email_verified = false where id = $1`, [
      invitee.id,
    ]);
    const inviter = await createUser();
    const workspaceId = await createWorkspace();
    const pendingId = await seedInvitation({
      workspaceId,
      inviterId: inviter.id,
      email: invitee.email,
    });
    await seedInvitation({
      workspaceId,
      inviterId: inviter.id,
      email: invitee.email,
      expiresAt: new Date(Date.now() - 60_000),
    });
    await seedInvitation({
      workspaceId,
      inviterId: inviter.id,
      email: "someone-else@example.com",
    });

    const token = await createSession(invitee.id);
    const response = await app.request("/api/invitations/pending", {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([{ id: pendingId, email: invitee.email }]);
  });

  it("allows cancel-only members to list invitations and exposes safe capabilities", async () => {
    const manager = await createUser();
    const inviter = await createUser();
    const workspaceId = await createWorkspace();
    await getDatabasePool().query(
      `insert into workspace_role (id, workspace_id, role, permission, created_at, updated_at)
       values ($1, $2, 'cancel-only', $3, now(), now())`,
      [createId(), workspaceId, JSON.stringify({ workspace: ["read"], invitation: ["cancel"] })],
    );
    await addMember(workspaceId, manager.id, "cancel-only");
    const invitationId = await seedInvitation({
      workspaceId,
      inviterId: inviter.id,
      email: "private-invitee@example.com",
    });
    const headers = { authorization: `Bearer ${await createSession(manager.id)}` };

    const capabilities = await app.request(
      `/api/workspaces/${workspaceId}/invitation-capabilities`,
      { headers },
    );
    expect(capabilities.status).toBe(200);
    expect(await capabilities.json()).toEqual({
      canList: true,
      canCreate: false,
      canCancel: true,
      canChangeMembers: false,
    });

    const listed = await app.request(`/api/workspaces/${workspaceId}/invitations`, { headers });
    expect(listed.status).toBe(200);
    expect(await listed.json()).toMatchObject([
      { id: invitationId, email: "private-invitee@example.com", status: "pending" },
    ]);
  });

  it("forbids viewers from listing invitations containing invited emails", async () => {
    const viewer = await createUser();
    const inviter = await createUser();
    const workspaceId = await createWorkspace();
    await getDatabasePool().query(
      `insert into workspace_role (id, workspace_id, role, permission, created_at, updated_at)
       values ($1, $2, 'viewer', $3, now(), now())`,
      [createId(), workspaceId, JSON.stringify({ workspace: ["read"] })],
    );
    await addMember(workspaceId, viewer.id, "viewer");
    await seedInvitation({
      workspaceId,
      inviterId: inviter.id,
      email: "private-invitee@example.com",
    });
    const headers = { authorization: `Bearer ${await createSession(viewer.id)}` };

    const capabilities = await app.request(
      `/api/workspaces/${workspaceId}/invitation-capabilities`,
      { headers },
    );
    expect(capabilities.status).toBe(200);
    expect(await capabilities.json()).toEqual({
      canList: false,
      canCreate: false,
      canCancel: false,
      canChangeMembers: false,
    });

    const response = await app.request(`/api/workspaces/${workspaceId}/invitations`, {
      headers,
    });
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain("private-invitee@example.com");
  });

  it("lists the immutable owner and stored custom workspace roles", async () => {
    const member = await createUser();
    const workspaceId = await createWorkspace();
    await getDatabasePool().query(
      `insert into workspace_role (id, workspace_id, role, permission, created_at, updated_at)
       values ($1, $2, 'custom-auditor', $3, now(), now()),
              ($4, $2, 'member', $5, now(), now())`,
      [
        createId(),
        workspaceId,
        JSON.stringify({ workspace: ["read"], member: ["read"] }),
        createId(),
        JSON.stringify({ workspace: ["read"] }),
      ],
    );
    await addMember(workspaceId, member.id, "member");

    const response = await app.request(`/api/workspaces/${workspaceId}/roles`, {
      headers: { authorization: `Bearer ${await createSession(member.id)}` },
    });
    expect(response.status).toBe(200);
    const roles = (await response.json()) as string[];
    expect(roles).toContain("owner");
    expect(roles).toContain("member");
    expect(roles).toContain("custom-auditor");
    expect(roles.filter((role) => role === "owner")).toHaveLength(1);
  });

  it("rejects an email mismatch without disclosing either email, and accepts for the matching account", async () => {
    const inviter = await createUser();
    const invitee = await createUser({ email: "invitee@example.com" });
    const otherUser = await createUser({ email: "other@example.com" });
    await getDatabasePool().query(`update "user" set email_verified = false where id = $1`, [
      invitee.id,
    ]);
    const workspaceId = await createWorkspace();
    await addMember(workspaceId, inviter.id, "owner");
    const invitationId = await seedInvitation({
      workspaceId,
      inviterId: inviter.id,
      email: invitee.email,
    });
    const receivedEvents: unknown[] = [];
    await subscribeToEvent("invitation.accepted", async (event) => {
      receivedEvents.push(event);
    });

    const mismatch = await app.request("/api/invitations/accept", {
      method: "POST",
      headers: {
        authorization: `Bearer ${await createSession(otherUser.id)}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ invitationId }),
    });
    expect(mismatch.status).toBe(403);
    const mismatchBody = await mismatch.text();
    expect(mismatchBody).not.toContain(invitee.email);
    expect(mismatchBody).not.toContain(otherUser.email);

    const accepted = await app.request("/api/invitations/accept", {
      method: "POST",
      headers: {
        authorization: `Bearer ${await createSession(invitee.id)}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ invitationId }),
    });
    expect(accepted.status).toBe(200);
    const { rows } = await getDatabasePool().query<{ status: string }>(
      `select status from invitation where id = $1`,
      [invitationId],
    );
    expect(rows[0]?.status).toBe("accepted");
    expect(receivedEvents).toEqual([
      {
        invitationId,
        inviterId: inviter.id,
        acceptedUserId: invitee.id,
        workspaceId,
      },
    ]);
  });

  it("forbids demoting or removing the only workspace owner", async () => {
    const owner = await createUser();
    const workspaceId = await createWorkspace();
    await seedRole(workspaceId, "member");
    await addMember(workspaceId, owner.id, "owner");
    const { rows } = await getDatabasePool().query<{ id: string }>(
      `select id from workspace_member where workspace_id = $1 and user_id = $2`,
      [workspaceId, owner.id],
    );
    const memberId = rows[0]?.id;
    if (!memberId) throw new Error("Expected owner membership fixture");
    const token = await createSession(owner.id);
    const headers = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };

    const demote = await app.request(`/api/members/${memberId}/role`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ role: "member" }),
    });
    expect(demote.status).toBe(409);

    const remove = await app.request(`/api/members/${memberId}`, { method: "DELETE", headers });
    expect(remove.status).toBe(409);
  });

  it("lists, updates, and removes members through Better Auth organization operations", async () => {
    const owner = await createUser({ name: "Workspace Owner" });
    const target = await createUser({ name: "Teammate" });
    const workspaceId = await createWorkspace();
    await seedRole(workspaceId, "admin");
    await addMember(workspaceId, owner.id, "owner");
    await addMember(workspaceId, target.id, "member");
    const { rows } = await getDatabasePool().query<{ id: string }>(
      `select id from workspace_member where workspace_id = $1 and user_id = $2`,
      [workspaceId, target.id],
    );
    const memberId = rows[0]?.id;
    if (!memberId) throw new Error("Expected member fixture");
    const token = await createSession(owner.id);
    const headers = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };

    const listed = await app.request(`/api/workspaces/${workspaceId}/members`, { headers });
    expect(listed.status).toBe(200);
    expect(await listed.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: owner.id, email: owner.email, role: "owner" }),
        expect.objectContaining({ userId: target.id, email: target.email, role: "member" }),
      ]),
    );

    const updated = await app.request(`/api/members/${memberId}/role`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ role: "admin" }),
    });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toMatchObject({ member: { id: memberId, role: "admin" } });

    const removed = await app.request(`/api/members/${memberId}`, { method: "DELETE", headers });
    expect(removed.status).toBe(200);
    const { rows: remaining } = await getDatabasePool().query<{ count: string }>(
      `select count(*)::text as count from workspace_member where id = $1`,
      [memberId],
    );
    expect(remaining[0]?.count).toBe("0");
  });

  it("preserves an owner when direct Better Auth role updates race", async () => {
    const firstOwner = await createUser();
    const secondOwner = await createUser();
    const workspaceId = await createWorkspace();
    await addMember(workspaceId, firstOwner.id, "owner");
    await addMember(workspaceId, secondOwner.id, "owner");
    const { rows: members } = await getDatabasePool().query<{ id: string; user_id: string }>(
      `select id, user_id from workspace_member where workspace_id = $1`,
      [workspaceId],
    );
    const memberByUser = new Map(members.map((member) => [member.user_id, member.id]));
    const firstMemberId = memberByUser.get(firstOwner.id);
    const secondMemberId = memberByUser.get(secondOwner.id);
    if (!firstMemberId || !secondMemberId) throw new Error("Expected two owner memberships");

    const firstToken = await createSession(firstOwner.id);
    const secondToken = await createSession(secondOwner.id);
    const [first, second] = await Promise.all([
      app.request("/api/auth/organization/update-member-role", {
        method: "POST",
        headers: { authorization: `Bearer ${firstToken}`, "content-type": "application/json" },
        body: JSON.stringify({
          organizationId: workspaceId,
          memberId: firstMemberId,
          role: "member",
        }),
      }),
      app.request("/api/auth/organization/update-member-role", {
        method: "POST",
        headers: { authorization: `Bearer ${secondToken}`, "content-type": "application/json" },
        body: JSON.stringify({
          organizationId: workspaceId,
          memberId: secondMemberId,
          role: "member",
        }),
      }),
    ]);

    expect([first.status, second.status].filter((status) => status === 200)).toHaveLength(1);
    const { rows: owners } = await getDatabasePool().query<{ count: string }>(
      `select count(*)::text as count from workspace_member
        where workspace_id = $1 and 'owner' = any(string_to_array(role, ','))`,
      [workspaceId],
    );
    expect(Number(owners[0]?.count ?? 0)).toBe(1);
  });

  it("preserves an owner when direct Better Auth owner removals race", async () => {
    const firstOwner = await createUser();
    const secondOwner = await createUser();
    const workspaceId = await createWorkspace();
    await addMember(workspaceId, firstOwner.id, "owner");
    await addMember(workspaceId, secondOwner.id, "owner");
    const { rows: members } = await getDatabasePool().query<{ id: string; user_id: string }>(
      `select id, user_id from workspace_member where workspace_id = $1`,
      [workspaceId],
    );
    const memberByUser = new Map(members.map((member) => [member.user_id, member.id]));
    const firstMemberId = memberByUser.get(firstOwner.id);
    const secondMemberId = memberByUser.get(secondOwner.id);
    if (!firstMemberId || !secondMemberId) throw new Error("Expected two owner memberships");
    const firstToken = await createSession(firstOwner.id);
    const secondToken = await createSession(secondOwner.id);

    const [first, second] = await Promise.all([
      app.request("/api/auth/organization/remove-member", {
        method: "POST",
        headers: { authorization: `Bearer ${firstToken}`, "content-type": "application/json" },
        body: JSON.stringify({ organizationId: workspaceId, memberIdOrEmail: secondMemberId }),
      }),
      app.request("/api/auth/organization/remove-member", {
        method: "POST",
        headers: { authorization: `Bearer ${secondToken}`, "content-type": "application/json" },
        body: JSON.stringify({ organizationId: workspaceId, memberIdOrEmail: firstMemberId }),
      }),
    ]);

    expect([first.status, second.status].filter((status) => status === 200)).toHaveLength(1);
    const { rows: owners } = await getDatabasePool().query<{ count: string }>(
      `select count(*)::text as count from workspace_member
        where workspace_id = $1 and 'owner' = any(string_to_array(role, ','))`,
      [workspaceId],
    );
    expect(Number(owners[0]?.count ?? 0)).toBe(1);
  });

  it("denies member reads for users outside the workspace", async () => {
    const owner = await createUser();
    const outsider = await createUser();
    const workspaceId = await createWorkspace();
    await addMember(workspaceId, owner.id, "owner");

    const response = await app.request(`/api/workspaces/${workspaceId}/members`, {
      headers: { authorization: `Bearer ${await createSession(outsider.id)}` },
    });
    expect(response.status).toBe(403);
  });
});
