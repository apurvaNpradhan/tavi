import { Buffer } from "node:buffer";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDatabasePool } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import { createApiClient } from "../../packages/libs/src/orpc";
import { addMember, createUser, createWorkspace, truncateAllTables } from "./helpers/db";

const { app } = createApp();

/** The real browser client, whose transport is redirected at the Hono app. */
const originalFetch = globalThis.fetch;
let activeToken: string | undefined;

beforeEach(() => {
  activeToken = undefined;
  globalThis.fetch = ((input, init) => {
    const headers = new Headers(init?.headers);
    if (activeToken) {
      headers.set("authorization", `Bearer ${activeToken}`);
    }
    return app.request(input as string, { ...init, headers });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

/**
 * A session row is enough to authenticate: the Better Auth `bearer` plugin
 * resolves the `Authorization: Bearer <session token>` header against this
 * table, which is the same path a browser session takes.
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

/** The production client factory, talking to the app in-process. */
function rpcClient(token?: string) {
  activeToken = token;
  return createApiClient({ apiUrl: "http://localhost/api" }).client;
}

function authHeaders(token: string, extra?: Record<string, string>) {
  return { authorization: `Bearer ${token}`, ...extra };
}

describe("oRPC migration (HTTP surface)", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("serves the public instance status over REST and RPC", async () => {
    const rest = await app.request("/api/instance/status");
    expect(rest.status).toBe(200);
    expect(await rest.json()).toEqual({ hasUsers: false, hasAdmin: false });

    expect(await rpcClient().instance.getStatus()).toEqual({ hasUsers: false, hasAdmin: false });
  });

  it("rejects anonymous access to authenticated REST and RPC routes", async () => {
    const rest = await app.request("/api/user/me");
    expect(rest.status).toBe(401);

    await expect(rpcClient().user.getCurrentUser()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("keeps the existing REST paths and payloads for a member", async () => {
    const user = await createUser();
    const token = await createSession(user.id);

    const me = await app.request("/api/user/me", { headers: authHeaders(token) });
    expect(me.status).toBe(200);

    const profile = (await me.json()) as { id: string; name: string; email: string };
    expect(profile.id).toBe(user.id);
    expect(profile.name).toBe("Test User");
    expect(profile.email).toBe(user.email);
  });

  it("keeps the same behavior over RPC for a member", async () => {
    const user = await createUser();
    const token = await createSession(user.id);
    const client = rpcClient(token);

    const me = await client.user.getCurrentUser();
    expect(me.id).toBe(user.id);
    expect(me.email).toBe(user.email);
  });

  it("authorizes a team read from the team's owning workspace", async () => {
    const member = await createUser();
    const outsider = await createUser();
    const workspaceA = await createWorkspace("Workspace A");
    const workspaceB = await createWorkspace("Workspace B");
    await addMember(workspaceA, member.id, "member");

    const teamInA = createId();
    const teamInB = createId();
    await getDatabasePool().query(
      `insert into team (id, name, workspace_id, created_at)
       values ($1, 'Team A', $2, now()), ($3, 'Team B', $4, now())`,
      [teamInA, workspaceA, teamInB, workspaceB],
    );
    await getDatabasePool().query(
      `insert into workspace_role (id, workspace_id, role, permission, created_at, updated_at)
       values ($1, $2, 'member', '{"workspace":["read"]}', now(), now())`,
      [createId(), workspaceA],
    );

    const memberClient = rpcClient(await createSession(member.id));
    await expect(memberClient.team.getSummary({ teamId: teamInA })).resolves.toMatchObject({
      id: teamInA,
      name: "Team A",
    });
    await expect(memberClient.team.getSummary({ teamId: teamInB })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const outsiderClient = rpcClient(await createSession(outsider.id));
    await expect(outsiderClient.team.getSummary({ teamId: teamInA })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const rest = await app.request(`/api/team/${teamInA}`, {
      headers: authHeaders(await createSession(member.id)),
    });
    expect(rest.status).toBe(200);
    expect(await rest.json()).toMatchObject({ id: teamInA, name: "Team A" });
  });

  it("serves runtime feature flags publicly without credentials", async () => {
    const response = await app.request("/api/config");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      appName: expect.any(String),
      magicLinkEnabled: expect.any(Boolean),
      emailOtpEnabled: expect.any(Boolean),
      socialProviders: { google: expect.any(Boolean) },
    });
  });

  it("serves a merged OpenAPI document at /api/openapi", async () => {
    const response = await app.request("/api/openapi");
    expect(response.status).toBe(200);

    const document = (await response.json()) as {
      openapi: string;
      paths: Record<string, Record<string, { operationId?: string; security?: unknown[] }>>;
    };

    expect(document.openapi).toBe("3.1.0");
    // A router-described operation...
    expect(document.paths["/user/me"]?.get?.operationId).toBe("getCurrentUser");
    expect(document.paths["/team/{teamId}"]?.get?.operationId).toBe("getTeamSummary");
    // ...and a raw Hono operation merged in explicitly.
    expect(document.paths["/auth/get-session"]?.get?.operationId).toBe("getSession");
    expect(document.paths["/user/avatar/{id}"]?.get?.security).toEqual([]);
    expect(document.paths["/instance/status"]?.get?.security).toEqual([]);
    expect(document.paths["/config"]?.get?.security).toEqual([]);
  });

  it("does not expose procedures on the wrong protocol", async () => {
    // GET is not an allowed RPC method, so it must not match a procedure.
    const rpcGet = await app.request("/api/rpc/instance/getStatus");
    expect(rpcGet.status).toBe(404);

    // An unknown REST path stays a 404 rather than falling into a procedure.
    const unknown = await app.request("/api/does-not-exist");
    expect(unknown.status).toBe(404);
  });

  it("round-trips an avatar upload over RPC and the raw download route", async () => {
    const user = await createUser();
    const token = await createSession(user.id);
    const client = rpcClient(token);

    // The PNG magic bytes, which the server verifies before storing.
    const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const data = Buffer.from(pngSignature).toString("base64");

    const uploaded = await client.user.uploadAvatar({ contentType: "image/png", data });
    expect(uploaded.id).toBeTruthy();
    expect(uploaded.url).toBe(`/api/user/avatar/${uploaded.id}`);
    expect(uploaded.size).toBe(pngSignature.byteLength);

    // Uploading repoints the profile's image at the stored avatar, so a client
    // that only reads the session does not need a second call to see it.
    const profile = await client.user.getCurrentUser();
    expect(profile.image).toBe(uploaded.url);

    // The public download route is raw Hono and must serve the stored bytes.
    const download = await app.request(`/api/user/avatar/${uploaded.id}`);
    expect(download.status).toBe(200);
    expect(download.headers.get("content-type")).toBe("image/png");

    // The same procedure is reachable as JSON REST, as documented. A new
    // upload replaces the previous avatar, so the old id stops resolving.
    const restUpload = await app.request("/api/user/avatar", {
      method: "POST",
      headers: authHeaders(token, { "content-type": "application/json" }),
      body: JSON.stringify({ contentType: "image/png", data }),
    });
    expect(restUpload.status).toBe(200);
    const restUploaded = (await restUpload.json()) as { id: string };
    expect(restUploaded.id).not.toBe(uploaded.id);
    expect((await app.request(`/api/user/avatar/${uploaded.id}`)).status).toBe(404);
    expect((await app.request(`/api/user/avatar/${restUploaded.id}`)).status).toBe(200);

    await client.user.deleteAvatar();
    const afterDelete = await app.request(`/api/user/avatar/${restUploaded.id}`);
    expect(afterDelete.status).toBe(404);

    // The profile image is cleared in the same transaction as the row, so the
    // profile cannot keep pointing at an avatar that no longer resolves.
    const afterDeleteProfile = await client.user.getCurrentUser();
    expect(afterDeleteProfile.image).toBeNull();
  });
});
