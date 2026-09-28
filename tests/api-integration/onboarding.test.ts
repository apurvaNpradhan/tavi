import { readFileSync, readdirSync } from "node:fs";
import { createId } from "@paralleldrive/cuid2";
import { beforeEach, describe, expect, it } from "vitest";
import { getDatabasePool } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import completeOnboardingWithWorkspace from "../../apps/api/src/user/operations/complete-onboarding";
import { completeWorkspaceCreationLifecycle } from "../../apps/api/src/workspace/workspace-lifecycle";
import { addMember, createUser, createWorkspace, truncateAllTables } from "./helpers/db";

const { app } = createApp();

/**
 * Onboarding progress is stored state, not a derived value, so these run against
 * real SQL: the failure this guards against is a predicate that matches no rows
 * and therefore does not throw. A user left on the first step is sent back
 * through setup on every sign-in, and nothing surfaces that as an error.
 */

async function readOnboardingStep(userId: string): Promise<string | undefined> {
  const { rows } = await getDatabasePool().query<{ onboarding_step: string }>(
    `select onboarding_step from "user" where id = $1`,
    [userId],
  );

  return rows[0]?.onboarding_step;
}

async function readName(userId: string): Promise<string | undefined> {
  const { rows } = await getDatabasePool().query<{ name: string }>(
    `select name from "user" where id = $1`,
    [userId],
  );

  return rows[0]?.name;
}

/**
 * A session row is enough to authenticate: the Better Auth `bearer` plugin
 * resolves `Authorization: Bearer <token>` against this table.
 */
async function createSession(userId: string): Promise<string> {
  const token = `${createId()}${createId()}`;
  await getDatabasePool().query(
    `insert into "session" (id, token, user_id, expires_at, created_at, updated_at)
     values ($1, $2, $3, now() + interval '1 day', now(), now())`,
    [createId(), token, userId],
  );

  return token;
}

/**
 * Signs a user in through the passwordless email-OTP flow.
 *
 * This template has no password sign-in, so the OTP endpoints are the client's
 * real path. The code is seeded rather than mailed: sending needs `RESEND_*`,
 * and the integration suite deliberately requires only PostgreSQL. Better Auth
 * stores a pending code as `<otp>:<attempts>` under `sign-in-otp-<email>` (its
 * default `storeOTP` is plaintext) and consumes the row on success, so a second
 * call plants a fresh code for the same address.
 */
async function signInWithEmailOtp(
  appInstance: ReturnType<typeof createApp>["app"],
  email: string,
): Promise<string> {
  const otp = "123456";

  await getDatabasePool().query(
    `insert into verification (id, identifier, value, expires_at, created_at, updated_at)
     values ($1, $2, $3, now() + interval '5 minutes', now(), now())`,
    [createId(), `sign-in-otp-${email}`, `${otp}:0`],
  );

  const response = await appInstance.request("/api/auth/sign-in/email-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  expect(response.status).toBe(200);
  const body = (await response.json()) as { user: { id: string } };
  return body.user.id;
}

async function readLatestActiveOrganizationId(userId: string): Promise<string | null> {
  const { rows } = await getDatabasePool().query<{ active_organization_id: string | null }>(
    `select active_organization_id
       from "session"
      where user_id = $1
      order by created_at desc
      limit 1`,
    [userId],
  );

  return rows[0]?.active_organization_id ?? null;
}

/**
 * Runs the backfill from the migration that introduced the column.
 *
 * Read from the migration file rather than restated here so the test covers the
 * statement that actually ships; a copy in the test would keep passing after the
 * migration drifted. The statement also wrote `default_org_slug`, a column
 * dropped after it landed, so that assignment is stripped before replaying it
 * against the current schema.
 */
async function runOnboardingBackfill(): Promise<void> {
  const migrationsDir = new URL("../../apps/api/drizzle", import.meta.url).pathname;
  const backfill = readdirSync(migrationsDir)
    .filter((name) => /^\d{4}_.*\.sql$/.test(name))
    .flatMap((name) => readFileSync(`${migrationsDir}/${name}`, "utf8").split(";"))
    // Ignore comments and find the shipped onboarding backfill regardless of
    // which forward migration contains it.
    .map((statement) =>
      statement
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .find(
      (statement) =>
        statement.toUpperCase().startsWith('UPDATE "USER"') &&
        statement.includes("onboarding_step"),
    );

  if (!backfill) throw new Error("Expected the onboarding migration to contain a backfill");

  const backfillAgainstCurrentSchema = backfill.replace(
    /,\s*default_org_slug = COALESCE\([\s\S]*?\n\s*\)/,
    "",
  );

  await getDatabasePool().query(backfillAgainstCurrentSchema);
}

describe("onboarding progress", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("starts a new user on the first step", async () => {
    const user = await createUser();

    expect(await readOnboardingStep(user.id)).toBe("profile");
  });

  it("accepts the name and step the profile form submits", async () => {
    const user = await createUser();
    const token = await createSession(user.id);

    // The profile step writes both fields in one `updateUser` call. This covers
    // the wiring that a unit test cannot: `onboardingStep` is a Better Auth
    // `additionalFields` entry, and a field declared with `input: false` — or
    // missing from the client's plugin list — is dropped silently rather than
    // rejected, leaving every user stuck on the first step.
    const response = await app.request("/api/auth/update-user", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "Sam Rivera", onboardingStep: "workspace" }),
    });

    expect(response.status).toBe(200);
    expect(await readName(user.id)).toBe("Sam Rivera");
    expect(await readOnboardingStep(user.id)).toBe("workspace");
  });

  it("completes setup when a workspace is created", async () => {
    const user = await createUser();
    await createWorkspace();

    await completeOnboardingWithWorkspace(user.id);

    expect(await readOnboardingStep(user.id)).toBe("completed");
  });

  it("seeds roles and completes onboarding through workspace lifecycle policy", async () => {
    const user = await createUser();
    const workspaceId = await createWorkspace();

    await completeWorkspaceCreationLifecycle({
      workspaceId,
      workspaceName: "Lifecycle Workspace",
      creatorUserId: user.id,
    });

    expect(await readOnboardingStep(user.id)).toBe("completed");
    const { rows } = await getDatabasePool().query<{ count: string }>(
      `select count(*)::text as count from workspace_role where workspace_id = $1`,
      [workspaceId],
    );
    expect(Number(rows[0]?.count ?? 0)).toBe(3);
  });

  it("is a no-op for a user that does not exist", async () => {
    await expect(completeOnboardingWithWorkspace("missing-user")).resolves.toBeUndefined();
  });

  it("backfills existing workspace members to completed", async () => {
    const member = await createUser();
    const outsider = await createUser();
    const workspaceId = await createWorkspace();
    await addMember(workspaceId, member.id, "member");

    await runOnboardingBackfill();

    // A user who already belongs to a workspace has no setup left to do, so the
    // migration must not send them back through it.
    expect(await readOnboardingStep(member.id)).toBe("completed");
    expect(await readOnboardingStep(outsider.id)).toBe("profile");
  });

  it("starts a new session on the member's earliest workspace", async () => {
    const email = "earliest-workspace@example.com";
    const userId = await signInWithEmailOtp(app, email);
    const earliestWorkspaceId = await createWorkspace("Earliest Workspace");
    const laterWorkspaceId = await createWorkspace("Later Workspace");
    await addMember(earliestWorkspaceId, userId, "member");
    await addMember(laterWorkspaceId, userId, "member");

    // `addMember` stamps both rows with `now()`, so make the ordering explicit.
    await getDatabasePool().query(
      `update workspace_member set joined_at = now() - interval '1 hour'
        where workspace_id = $1 and user_id = $2`,
      [earliestWorkspaceId, userId],
    );
    await getDatabasePool().query(`delete from "session" where user_id = $1`, [userId]);

    // A second sign-in must derive the workspace again rather than reuse what
    // the deleted session had.
    expect(await signInWithEmailOtp(app, email)).toBe(userId);

    expect(await readLatestActiveOrganizationId(userId)).toBe(earliestWorkspaceId);
  });
});
