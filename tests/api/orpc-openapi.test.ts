import { describe, expect, it } from "vitest";
import { buildApiDocument } from "../../apps/api/src/openapi-document";
import { router } from "../../apps/api/src/router";

type Operation = {
  operationId?: string;
  security?: unknown[];
  responses?: Record<string, unknown>;
};
type Document = {
  openapi: string;
  servers?: { url: string }[];
  paths: Record<string, Record<string, Operation>>;
  components?: { securitySchemes?: Record<string, unknown> };
};

/** Every operation the router is expected to expose over REST. */
const EXPECTED_OPERATIONS = [
  "GET /config # getRuntimeConfig",
  "GET /instance/status # getInstanceStatus",
  "GET /invitations/pending # getPendingInvitations",
  "GET /invitation/{invitationId} # getInvitationDetails",
  "GET /workspaces/{workspaceId}/invitation-capabilities # getInvitationCapabilities",
  "GET /notifications # listNotifications",
  "GET /notifications/unread-count # getUnreadNotificationCount",
  "GET /team/{teamId} # getTeamSummary",
  "GET /user/me # getCurrentUser",
  "GET /workspaces/{workspaceId}/invitations # listWorkspaceInvitations",
  "GET /workspaces/{workspaceId}/members # listWorkspaceMembers",
  "GET /workspaces/{workspaceId}/roles # listWorkspaceRoles",
  "POST /invitations/accept # acceptInvitation",
  "POST /notifications/{notificationId}/read # markNotificationRead",
  "POST /user/avatar # uploadAvatar",
  "POST /workspaces/{workspaceId}/invitations # createInvitation",
  "DELETE /invitations/{invitationId} # cancelInvitation",
  "DELETE /members/{memberId} # removeWorkspaceMember",
  "DELETE /notifications # clearNotifications",
  "DELETE /user/avatar # deleteAvatar",
  "PATCH /members/{memberId}/role # updateWorkspaceMemberRole",
].toSorted();

function flatten(paths: Document["paths"]): string[] {
  const lines: string[] = [];
  for (const [path, operations] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(operations)) {
      if (!["get", "post", "put", "delete", "patch"].includes(method)) continue;
      lines.push(`${method.toUpperCase()} ${path} # ${operation.operationId}`);
    }
  }
  return lines.toSorted();
}

describe("oRPC OpenAPI document", () => {
  it("describes every router procedure with its method, path and operationId", async () => {
    const document = (await buildApiDocument({})) as Document;

    expect(document.openapi).toBe("3.1.0");
    expect(flatten(document.paths)).toEqual(EXPECTED_OPERATIONS);
    expect(document.components?.securitySchemes?.bearerAuth).toBeDefined();
    expect(document.servers?.[0]?.url).toMatch(/\/api$/);
  });

  it("marks public procedures with an empty security array", async () => {
    const document = (await buildApiDocument({})) as Document;

    expect(document.paths["/instance/status"]?.get?.security).toEqual([]);
    expect(document.paths["/config"]?.get?.security).toEqual([]);
    expect(document.paths["/invitation/{invitationId}"]?.get?.security).toEqual([]);
    expect(document.paths["/user/me"]?.get?.security).toBeUndefined();
  });

  it("injects the shared 401 on authenticated operations only", async () => {
    const document = (await buildApiDocument({})) as Document;

    expect(document.paths["/user/me"]?.get?.responses?.["401"]).toBeDefined();
    expect(document.paths["/instance/status"]?.get?.responses?.["401"]).toBeUndefined();
  });

  it("merges raw operations and applies the same 401 rule to them", async () => {
    const document = (await buildApiDocument({
      "/auth/get-session": {
        get: {
          operationId: "getSession",
          security: [],
          responses: { 200: { description: "Session details, or null" } },
        },
      },
      "/example/private": {
        get: {
          operationId: "examplePrivateOperation",
          responses: { 200: { description: "A raw authenticated operation" } },
        },
      },
    })) as Document;

    expect(document.paths["/auth/get-session"]?.get?.operationId).toBe("getSession");
    expect(document.paths["/auth/get-session"]?.get?.responses?.["401"]).toBeUndefined();
    expect(document.paths["/example/private"]?.get?.responses?.["401"]).toBeDefined();
  });

  it("exposes the same procedure names over the RPC router", () => {
    expect(Object.keys(router)).toEqual([
      "instance",
      "user",
      "config",
      "team",
      "invitation",
      "member",
      "workspaceRole",
      "notification",
    ]);
    expect(Object.keys(router.user)).toEqual(["getCurrentUser", "uploadAvatar", "deleteAvatar"]);
    expect(Object.keys(router.invitation)).toEqual([
      "getDetails",
      "getPending",
      "accept",
      "create",
      "list",
      "capabilities",
      "cancel",
    ]);
    expect(Object.keys(router.notification)).toEqual(["list", "unreadCount", "markRead", "clear"]);
    expect(Object.keys(router.member)).toEqual(["list", "updateRole", "remove"]);
    expect(Object.keys(router.workspaceRole)).toEqual(["list"]);
  });
});
