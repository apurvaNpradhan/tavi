import { createId } from "@paralleldrive/cuid2";
import { beforeEach, describe, expect, it } from "vitest";
import { getDatabasePool } from "../../apps/api/src/database";
import { checkRegistrationAllowed } from "../../apps/api/src/utils/check-registration-allowed";
import { hasPendingInvitationForEmail } from "../../apps/api/src/utils/registration-policy";
import { createUser, createWorkspace, truncateAllTables } from "./helpers/db";

/**
 * Invitation-gated registration is the only way onto an instance with
 * `DISABLE_REGISTRATION=true`, so its predicate is a security boundary. These
 * tests exercise it against real SQL because the failure mode is a `WHERE`
 * clause that is too permissive — a mocked database would happily return the
 * row it was told to.
 */

async function seedInvitation(options: {
  email: string;
  status?: string;
  expiresAt?: Date;
}): Promise<{ id: string }> {
  const inviter = await createUser();
  const workspaceId = await createWorkspace();
  const id = createId();

  await getDatabasePool().query(
    `insert into invitation (id, workspace_id, email, role, status, expires_at, inviter_id)
     values ($1, $2, $3, 'member', $4, $5, $6)`,
    [
      id,
      workspaceId,
      // Better Auth's organization adapter stores invitee emails lowercased;
      // seed fixtures the same way so the test mirrors production rows.
      options.email.toLowerCase(),
      options.status ?? "pending",
      options.expiresAt ?? new Date(Date.now() + 86_400_000),
      inviter.id,
    ],
  );

  return { id };
}

/** A closed instance is one that already has a registered (non-guest) user. */
async function seedRegisteredUser(): Promise<void> {
  await createUser({ role: "user" });
}

describe("registration policy: invitation gating", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("allows a pending, unexpired invitation for the exact email", async () => {
    await seedRegisteredUser();
    const email = `invited-${createId()}@example.com`;
    const invitation = await seedInvitation({ email });

    await expect(hasPendingInvitationForEmail(email, invitation.id)).resolves.toBe(true);
    await expect(checkRegistrationAllowed(email, invitation.id, true)).resolves.toEqual({
      allowed: true,
    });
  });

  it("matches the invitation email case-insensitively", async () => {
    await seedRegisteredUser();
    const email = `invited-${createId()}@example.com`;
    const invitation = await seedInvitation({ email });

    await expect(hasPendingInvitationForEmail(email.toUpperCase(), invitation.id)).resolves.toBe(
      true,
    );
  });

  it("rejects a pending invitation ID presented for a different email", async () => {
    await seedRegisteredUser();
    const invitation = await seedInvitation({ email: `invited-${createId()}@example.com` });

    await expect(
      hasPendingInvitationForEmail(`attacker-${createId()}@example.com`, invitation.id),
    ).resolves.toBe(false);
    await expect(
      checkRegistrationAllowed(`attacker-${createId()}@example.com`, invitation.id, true),
    ).resolves.toMatchObject({ allowed: false });
  });

  it("rejects an expired invitation even when its ID matches the email", async () => {
    await seedRegisteredUser();
    const email = `invited-${createId()}@example.com`;
    const invitation = await seedInvitation({
      email,
      expiresAt: new Date(Date.now() - 86_400_000),
    });

    await expect(hasPendingInvitationForEmail(email, invitation.id)).resolves.toBe(false);
    await expect(checkRegistrationAllowed(email, invitation.id, true)).resolves.toMatchObject({
      allowed: false,
    });
  });

  it("rejects an expired invitation matched by email without an ID", async () => {
    await seedRegisteredUser();
    const email = `invited-${createId()}@example.com`;
    await seedInvitation({ email, expiresAt: new Date(Date.now() - 86_400_000) });

    await expect(hasPendingInvitationForEmail(email, null)).resolves.toBe(false);
    await expect(checkRegistrationAllowed(email, null, true)).resolves.toMatchObject({
      allowed: false,
    });
  });

  it.each(["accepted", "canceled", "rejected"])(
    "rejects a %s invitation by ID and by email",
    async (status) => {
      await seedRegisteredUser();
      const email = `invited-${createId()}@example.com`;
      const invitation = await seedInvitation({ email, status });

      await expect(hasPendingInvitationForEmail(email, invitation.id)).resolves.toBe(false);
      await expect(hasPendingInvitationForEmail(email, null)).resolves.toBe(false);
      await expect(checkRegistrationAllowed(email, invitation.id, true)).resolves.toMatchObject({
        allowed: false,
      });
    },
  );

  it("still admits the email's own invitation when an unrelated ID is supplied", async () => {
    // The ID is not a lookup override: a stray ID must not block a signup that
    // has a genuine, matching invitation of its own. The email predicate is
    // what grants access; the ID is only an extra narrowing hint.
    await seedRegisteredUser();
    const email = `invited-${createId()}@example.com`;
    await seedInvitation({ email });

    await expect(hasPendingInvitationForEmail(email, createId())).resolves.toBe(true);
  });

  it("allows ordinary signups while registration is open", async () => {
    await seedRegisteredUser();
    await expect(checkRegistrationAllowed("new@example.com", null, false)).resolves.toEqual({
      allowed: true,
    });
  });

  it("still lets the very first signup through while registration is closed", async () => {
    const email = `founder-${createId()}@example.com`;

    await expect(checkRegistrationAllowed(email, null, true)).resolves.toEqual({ allowed: true });
  });
});
