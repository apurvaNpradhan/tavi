import { createId } from "@paralleldrive/cuid2";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";
import { publishEvent, subscribeToEvent } from "../../apps/api/src/events";
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

async function createInvitation(workspaceId: string, inviterId: string, email: string) {
  const invitationId = createId();
  await getDatabasePool().query(
    `insert into invitation (id, workspace_id, email, role, status, expires_at, inviter_id)
     values ($1, $2, $3, 'member', 'pending', now() + interval '1 day', $4)`,
    [invitationId, workspaceId, email, inviterId],
  );
  return invitationId;
}

describe("user notifications", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("isolates records by user and supports unread, read, pagination, and clear", async () => {
    const owner = await createUser();
    const other = await createUser();
    const accepter = await createUser();
    const workspaceId = await createWorkspace();
    const firstInvitation = await createInvitation(workspaceId, owner.id, accepter.email);
    const secondInvitation = await createInvitation(workspaceId, owner.id, accepter.email);

    await publishEvent(
      "invitation.accepted",
      {
        invitationId: firstInvitation,
        inviterId: owner.id,
        acceptedUserId: accepter.id,
        workspaceId,
      },
      { waitForHandlers: true },
    );
    await publishEvent(
      "invitation.accepted",
      {
        invitationId: secondInvitation,
        inviterId: owner.id,
        acceptedUserId: accepter.id,
        workspaceId,
      },
      { waitForHandlers: true },
    );

    const ownerHeaders = { authorization: `Bearer ${await createSession(owner.id)}` };
    const otherHeaders = { authorization: `Bearer ${await createSession(other.id)}` };

    const ownerList = await app.request("/api/notifications?limit=1&offset=0", {
      headers: ownerHeaders,
    });
    expect(ownerList.status).toBe(200);
    const page = await ownerList.json();
    expect(page).toMatchObject({ limit: 1, offset: 0 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      type: "invitation.accepted",
      readAt: null,
    });
    expect(page.items[0]).not.toHaveProperty("invitationId");
    expect(page.items[0]).not.toHaveProperty("recipientId");
    expect(page.items[0]).not.toHaveProperty("acceptedUserId");
    expect(page.items[0]).not.toHaveProperty("workspaceId");

    const isolatedList = await app.request("/api/notifications", { headers: otherHeaders });
    expect(await isolatedList.json()).toMatchObject({ items: [] });
    expect(
      await (
        await app.request("/api/notifications/unread-count", { headers: otherHeaders })
      ).json(),
    ).toEqual({ count: 0 });

    const unread = await app.request("/api/notifications/unread-count", { headers: ownerHeaders });
    expect(await unread.json()).toEqual({ count: 2 });

    const all = await app.request("/api/notifications?limit=10", { headers: ownerHeaders });
    const allItems = (await all.json()).items;
    const notificationId = allItems[0].id as string;

    const foreignRead = await app.request(`/api/notifications/${notificationId}/read`, {
      method: "POST",
      headers: otherHeaders,
    });
    expect(await foreignRead.json()).toEqual({ success: false });
    const read = await app.request(`/api/notifications/${notificationId}/read`, {
      method: "POST",
      headers: ownerHeaders,
    });
    expect(await read.json()).toEqual({ success: true });
    const unreadAfterRead = await app.request("/api/notifications/unread-count", {
      headers: ownerHeaders,
    });
    expect(await unreadAfterRead.json()).toEqual({ count: 1 });

    const foreignClear = await app.request("/api/notifications", {
      method: "DELETE",
      headers: otherHeaders,
    });
    expect(await foreignClear.json()).toEqual({ deletedCount: 0 });
    const clear = await app.request("/api/notifications", {
      method: "DELETE",
      headers: ownerHeaders,
    });
    expect(await clear.json()).toEqual({ deletedCount: 2 });
    const empty = await app.request("/api/notifications", { headers: ownerHeaders });
    expect((await empty.json()).items).toEqual([]);
  });

  it("deduplicates repeated event delivery and does not notify the accepting inviter", async () => {
    const inviter = await createUser();
    const accepter = await createUser();
    const workspaceId = await createWorkspace();
    const invitationId = await createInvitation(workspaceId, inviter.id, accepter.email);
    const selfInvitationId = await createInvitation(workspaceId, inviter.id, inviter.email);

    const event = {
      invitationId,
      inviterId: inviter.id,
      acceptedUserId: accepter.id,
      workspaceId,
    };
    await publishEvent("invitation.accepted", event, { waitForHandlers: true });
    await publishEvent("invitation.accepted", event, { waitForHandlers: true });
    await publishEvent(
      "invitation.accepted",
      {
        invitationId: selfInvitationId,
        inviterId: inviter.id,
        acceptedUserId: inviter.id,
        workspaceId,
      },
      { waitForHandlers: true },
    );

    const { rows } = await getDatabasePool().query<{ count: string }>(
      `select count(*)::text as count from notification where recipient_id = $1`,
      [inviter.id],
    );
    expect(rows[0]?.count).toBe("1");
  });

  it("creates the inviter notification from the real invitation acceptance event", async () => {
    const inviter = await createUser({ name: "Workspace Owner" });
    const invitee = await createUser({ email: "invitee@example.com" });
    await getDatabasePool().query(`update "user" set email_verified = false where id = $1`, [
      invitee.id,
    ]);
    const workspaceId = await createWorkspace();
    await addMember(workspaceId, inviter.id, "owner");
    const invitationId = await createInvitation(workspaceId, inviter.id, invitee.email);

    const response = await app.request("/api/invitations/accept", {
      method: "POST",
      headers: {
        authorization: `Bearer ${await createSession(invitee.id)}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ invitationId }),
    });
    expect(response.status).toBe(200);

    const { rows } = await getDatabasePool().query<{
      recipient_id: string;
      type: string;
      invitation_id: string;
    }>(`select recipient_id, type, invitation_id from notification where invitation_id = $1`, [
      invitationId,
    ]);
    expect(rows).toEqual([
      { recipient_id: inviter.id, type: "invitation.accepted", invitation_id: invitationId },
    ]);
  });

  it("keeps acceptance successful when a post-commit event subscriber fails", async () => {
    const inviter = await createUser();
    const invitee = await createUser({ email: "subscriber-failure@example.com" });
    await getDatabasePool().query(`update "user" set email_verified = false where id = $1`, [
      invitee.id,
    ]);
    const workspaceId = await createWorkspace();
    await addMember(workspaceId, inviter.id, "owner");
    const invitationId = await createInvitation(workspaceId, inviter.id, invitee.email);

    subscribeToEvent(
      "invitation.accepted",
      async () => {
        throw new Error("simulated subscriber failure");
      },
      { propagateErrors: true },
    );

    const response = await app.request("/api/invitations/accept", {
      method: "POST",
      headers: {
        authorization: `Bearer ${await createSession(invitee.id)}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ invitationId }),
    });
    expect(response.status).toBe(200);

    const { rows } = await getDatabasePool().query<{
      recipient_id: string;
      invitation_id: string;
    }>(`select recipient_id, invitation_id from notification where invitation_id = $1`, [
      invitationId,
    ]);
    expect(rows).toEqual([{ recipient_id: inviter.id, invitation_id: invitationId }]);
  });
});
