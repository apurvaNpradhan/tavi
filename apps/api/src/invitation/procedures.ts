import { and, count, eq, sql } from "drizzle-orm";
import { openapi } from "@orpc/openapi";
import { ORPCError } from "@orpc/server";
import { APIError } from "better-auth/api";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import { auth } from "../auth";
import db, { schema } from "../database";
import { responseTimestamp } from "../openapi";
import { authedProcedure, publicProcedure } from "../orpc/base";
import { requireWorkspace } from "../orpc/workspace";
import { evaluateWorkspacePermissions } from "../utils/require-workspace-permission";
import { isAdministratorUserId } from "../utils/is-instance-admin";
import {
  getInvitationDetails,
  getMemberForManagement,
  getMemberWorkspaceId,
  workspaceHasRole,
} from "./operations/get-invitation-details";

const invitationDetailsSchema = z.object({
  valid: z.boolean(),
  invitation: z
    .object({
      id: z.string(),
      email: z.email(),
      workspaceName: z.string(),
      inviterName: z.string(),
      expiresAt: responseTimestamp,
    })
    .optional(),
});

const pendingInvitationSchema = z.object({
  id: z.string(),
  email: z.email(),
  workspaceId: z.string(),
  workspaceName: z.string(),
  inviterName: z.string(),
  role: z.string(),
  expiresAt: responseTimestamp,
  createdAt: responseTimestamp,
});

const workspaceInvitationSchema = z.object({
  id: z.string(),
  email: z.email(),
  role: z.string(),
  status: z.string(),
  expiresAt: responseTimestamp,
  createdAt: responseTimestamp,
});

const invitationCapabilitiesSchema = z.object({
  canList: z.boolean(),
  canCreate: z.boolean(),
  canCancel: z.boolean(),
  canChangeMembers: z.boolean(),
});

const workspaceRoleSchema = z.string();

const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string().nullable().optional(),
  role: z.string(),
  joinedAt: responseTimestamp,
});

const safeMemberResultSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  role: z.string(),
});

const workspaceInput = z.object({ workspaceId: z.string().min(1) });
const invitationIdInput = z.object({ invitationId: z.string().min(1) });
const memberIdInput = z.object({ memberId: z.string().min(1) });

function requireSession(context: { session: unknown; apiKey?: unknown }): void {
  if (context.apiKey || !context.session) {
    throw new HTTPException(401, { message: "A signed-in session is required" });
  }
}

/** Converts expected Better Auth operation failures into safe HTTP errors. */
async function runBetterAuthOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!(error instanceof APIError)) throw error;

    const status = toSafeHttpStatus(error.statusCode);
    const message =
      status >= 500 ? "Organization service is unavailable" : "Organization operation failed";
    throw new HTTPException(status, { message });
  }
}

function toSafeHttpStatus(status: number): ContentfulStatusCode {
  switch (status) {
    case 400:
      return 400;
    case 401:
      return 401;
    case 403:
      return 403;
    case 404:
      return 404;
    case 409:
      return 409;
    case 422:
      return 422;
    case 429:
      return 429;
    case 503:
      return 503;
    default:
      return 500;
  }
}

async function invitationWorkspaceId(invitationId: string): Promise<string | null> {
  const [invitation] = await db
    .select({ workspaceId: schema.invitationTable.workspaceId })
    .from(schema.invitationTable)
    .where(eq(schema.invitationTable.id, invitationId))
    .limit(1);

  return invitation?.workspaceId ?? null;
}

/** Public invitation lookup; the opaque invitation ID is the bearer credential. */
const getDetails = publicProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/invitation/{invitationId}",
      operationId: "getInvitationDetails",
      tags: ["Invitations"],
      summary: "Get invitation details",
      description: "Looks up minimal details using the opaque ID in an invitation link.",
      spec: (operation) => ({ ...operation, security: [] }),
    }),
  )
  .input(z.object({ invitationId: z.string().min(1) }))
  .output(invitationDetailsSchema)
  .handler(async ({ input }) => getInvitationDetails(input.invitationId));

/** Lists pending invitations addressed to the signed-in account email. */
const getPending = authedProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/invitations/pending",
      operationId: "getPendingInvitations",
      tags: ["Invitations"],
      summary: "Get pending invitations",
      description: "Lists unexpired pending invitations for the signed-in account email.",
    }),
  )
  .output(z.array(pendingInvitationSchema))
  .handler(async ({ context }) => {
    requireSession(context);
    const pending = await db
      .select({
        id: schema.invitationTable.id,
        email: schema.invitationTable.email,
        workspaceId: schema.invitationTable.workspaceId,
        workspaceName: schema.workspaceTable.name,
        inviterName: schema.userTable.name,
        role: schema.invitationTable.role,
        expiresAt: schema.invitationTable.expiresAt,
        createdAt: schema.invitationTable.createdAt,
      })
      .from(schema.invitationTable)
      .innerJoin(
        schema.workspaceTable,
        eq(schema.invitationTable.workspaceId, schema.workspaceTable.id),
      )
      .innerJoin(schema.userTable, eq(schema.invitationTable.inviterId, schema.userTable.id))
      .where(
        and(
          eq(schema.invitationTable.email, context.userEmail.toLowerCase()),
          eq(schema.invitationTable.status, "pending"),
          sql`${schema.invitationTable.expiresAt} > now()`,
        ),
      )
      .orderBy(schema.invitationTable.createdAt);

    return pending.map((invitation) => ({ ...invitation, role: invitation.role ?? "member" }));
  });

/** Accepts an invitation through Better Auth after checking the recipient email without exposing it. */
const accept = authedProcedure
  .meta(
    openapi({
      method: "POST",
      path: "/invitations/accept",
      operationId: "acceptInvitation",
      tags: ["Invitations"],
      summary: "Accept an invitation",
      description: "Accepts an invitation for the signed-in account when its email matches.",
    }),
  )
  .input(invitationIdInput)
  .output(z.object({ workspaceId: z.string(), memberId: z.string() }))
  .handler(async ({ input, context }) => {
    requireSession(context);
    const [invitation] = await db
      .select({
        email: schema.invitationTable.email,
        status: schema.invitationTable.status,
        expiresAt: schema.invitationTable.expiresAt,
      })
      .from(schema.invitationTable)
      .where(eq(schema.invitationTable.id, input.invitationId))
      .limit(1);

    if (!invitation || invitation.status !== "pending" || invitation.expiresAt <= new Date()) {
      throw new ORPCError("NOT_FOUND", { message: "Invitation is unavailable" });
    }
    if (invitation.email.toLowerCase() !== context.userEmail.toLowerCase()) {
      throw new ORPCError("FORBIDDEN", {
        message: "Invitation cannot be accepted by this account",
      });
    }

    const accepted = await runBetterAuthOperation(() =>
      auth.api.acceptInvitation({
        body: { invitationId: input.invitationId },
        headers: context.headers,
      }),
    );
    return {
      workspaceId: accepted.invitation.organizationId,
      memberId: accepted.member.id,
    };
  });

/** Creates an invitation through Better Auth after Tavi's workspace permission check. */
const create = authedProcedure
  .meta(
    openapi({
      method: "POST",
      path: "/workspaces/{workspaceId}/invitations",
      operationId: "createInvitation",
      tags: ["Invitations"],
      summary: "Invite a workspace member",
      description: "Creates an invitation for an email address and a workspace role.",
    }),
  )
  .input(
    workspaceInput.extend({
      email: z.email().transform((email) => email.trim().toLowerCase()),
      role: z.string().min(1),
    }),
  )
  .use(
    requireWorkspace((input: z.infer<typeof workspaceInput>) => input.workspaceId, {
      invitation: ["create"],
    }),
  )
  .output(
    z.object({
      id: z.string(),
      email: z.email(),
      role: z.string(),
      organizationId: z.string(),
      inviterId: z.string(),
      status: z.string(),
      expiresAt: responseTimestamp,
      createdAt: responseTimestamp,
    }),
  )
  .handler(async ({ input, context }) => {
    requireSession(context);
    if (!(await workspaceHasRole(context.workspaceId, input.role))) {
      throw new ORPCError("BAD_REQUEST", { message: "Role does not exist in this workspace" });
    }

    return runBetterAuthOperation(() =>
      auth.api.createInvitation({
        body: { email: input.email, role: input.role, organizationId: context.workspaceId },
        headers: context.headers,
      }),
    );
  });

/** Lists workspace invitations through Better Auth's organization API. */
const list = authedProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/workspaces/{workspaceId}/invitations",
      operationId: "listWorkspaceInvitations",
      tags: ["Invitations"],
      summary: "List workspace invitations",
      description: "Lists invitations for a workspace the caller can manage.",
    }),
  )
  .input(workspaceInput)
  .use(
    requireWorkspace(
      (input: z.infer<typeof workspaceInput>) => input.workspaceId,
      [{ invitation: ["create"] }, { invitation: ["cancel"] }],
    ),
  )
  .output(z.array(workspaceInvitationSchema))
  .handler(async ({ context }) => {
    requireSession(context);
    const invitations = await runBetterAuthOperation(() =>
      auth.api.listInvitations({
        query: { organizationId: context.workspaceId },
        headers: context.headers,
      }),
    );
    return invitations
      .filter((invitation) => invitation.status === "pending")
      .map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      }));
  });

/**
 * Returns non-sensitive invitation management capabilities for the workspace.
 * Frontends can call `client.invitation.capabilities({ workspaceId })` before
 * calling `client.invitation.list({ workspaceId })`; `canList` is true only for
 * invitation creators or cancellers. It also reports whether the caller has
 * both member update and delete permissions for workspace member controls.
 * The response contains no invitation or member data.
 */
const capabilities = authedProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/workspaces/{workspaceId}/invitation-capabilities",
      operationId: "getInvitationCapabilities",
      tags: ["Invitations"],
      summary: "Get invitation capabilities",
      description: "Returns safe invitation management capabilities for the caller.",
    }),
  )
  .input(workspaceInput)
  .use(requireWorkspace((input: z.infer<typeof workspaceInput>) => input.workspaceId))
  .output(invitationCapabilitiesSchema)
  .handler(async ({ context }) => {
    requireSession(context);
    const subject = {
      userId: context.userId,
      workspaceId: context.workspaceId,
      apiKey: context.apiKey,
      isInstanceAdmin: context.apiKey?.permissions
        ? false
        : await isAdministratorUserId(context.userId),
    };
    const [canCreate, canCancel, canChangeMembers] = await evaluateWorkspacePermissions(subject, [
      { invitation: ["create"] },
      { invitation: ["cancel"] },
      { member: ["update", "delete"] },
    ]);
    const createAllowed = canCreate ?? false;
    const cancelAllowed = canCancel ?? false;
    return {
      canList: createAllowed || cancelAllowed,
      canCreate: createAllowed,
      canCancel: cancelAllowed,
      canChangeMembers: canChangeMembers ?? false,
    };
  });

/**
 * Lists role names in a workspace, including the immutable `owner` role.
 * Frontends call `client.workspaceRole.list({ workspaceId })`; the output is a
 * string array such as `["owner", "admin", "member", "viewer"]`.
 */
const listWorkspaceRoles = authedProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/workspaces/{workspaceId}/roles",
      operationId: "listWorkspaceRoles",
      tags: ["Members"],
      summary: "List workspace roles",
      description: "Lists role names available for workspace membership and invitations.",
    }),
  )
  .input(workspaceInput)
  .use(
    requireWorkspace((input: z.infer<typeof workspaceInput>) => input.workspaceId, {
      workspace: ["read"],
    }),
  )
  .output(z.array(workspaceRoleSchema))
  .handler(async ({ context }) => {
    requireSession(context);
    const editableRoles = await db
      .select({ role: schema.workspaceRoleTable.role })
      .from(schema.workspaceRoleTable)
      .where(
        and(
          eq(schema.workspaceRoleTable.workspaceId, context.workspaceId),
          sql`${schema.workspaceRoleTable.role} <> 'owner'`,
        ),
      )
      .orderBy(schema.workspaceRoleTable.role);

    return ["owner", ...editableRoles.map(({ role }) => role)];
  });

/** Revokes an invitation after resolving its workspace from the invitation row. */
const cancel = authedProcedure
  .meta(
    openapi({
      method: "DELETE",
      path: "/invitations/{invitationId}",
      operationId: "cancelInvitation",
      tags: ["Invitations"],
      summary: "Cancel an invitation",
      description: "Cancels a pending invitation in an authorized workspace.",
    }),
  )
  .input(invitationIdInput)
  .output(z.object({ success: z.boolean() }))
  .use(
    requireWorkspace(
      (input: z.infer<typeof invitationIdInput>) => invitationWorkspaceId(input.invitationId),
      { invitation: ["cancel"] },
    ),
  )
  .handler(async ({ input, context }) => {
    requireSession(context);
    await runBetterAuthOperation(() =>
      auth.api.cancelInvitation({
        body: { invitationId: input.invitationId },
        headers: context.headers,
      }),
    );
    return { success: true };
  });

/** Lists workspace members through Better Auth and returns only profile fields needed by the app. */
const listMembers = authedProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/workspaces/{workspaceId}/members",
      operationId: "listWorkspaceMembers",
      tags: ["Members"],
      summary: "List workspace members",
      description: "Lists members of a workspace the caller can read.",
    }),
  )
  .input(workspaceInput)
  .use(
    requireWorkspace((input: z.infer<typeof workspaceInput>) => input.workspaceId, {
      workspace: ["read"],
    }),
  )
  .output(z.array(memberSchema))
  .handler(async ({ context }) => {
    requireSession(context);
    const result = await runBetterAuthOperation(() =>
      auth.api.listMembers({
        query: { organizationId: context.workspaceId },
        headers: context.headers,
      }),
    );

    return result.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
      joinedAt: member.createdAt,
    }));
  });

/** Serializes owner changes per workspace while Better Auth performs its write. */
async function withOwnerChangeLock<T>(
  workspaceId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return db.transaction(async (transaction) => {
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${workspaceId}, 0))`,
    );
    return operation();
  });
}

async function assertNotLastOwner(workspaceId: string, memberId: string): Promise<void> {
  const target = await getMemberForManagement(memberId);
  if (target?.role !== "owner") return;

  const [owners] = await db
    .select({ value: count() })
    .from(schema.workspaceUserTable)
    .where(
      and(
        eq(schema.workspaceUserTable.workspaceId, workspaceId),
        eq(schema.workspaceUserTable.role, "owner"),
      ),
    );

  if ((owners?.value ?? 0) <= 1) {
    throw new ORPCError("CONFLICT", { message: "A workspace must keep at least one owner" });
  }
}

/** Changes a member role through Better Auth after Tavi's resource permission check. */
const updateRole = authedProcedure
  .meta(
    openapi({
      method: "PATCH",
      path: "/members/{memberId}/role",
      operationId: "updateWorkspaceMemberRole",
      tags: ["Members"],
      summary: "Update a member role",
      description: "Changes a member's role in its owning workspace.",
    }),
  )
  .input(memberIdInput.extend({ role: z.string().min(1) }))
  .use(
    requireWorkspace(
      (input: z.infer<typeof memberIdInput>) => getMemberWorkspaceId(input.memberId),
      { member: ["update"] },
    ),
  )
  .output(z.object({ member: safeMemberResultSchema }))
  .handler(async ({ input, context }) => {
    requireSession(context);
    if (!(await workspaceHasRole(context.workspaceId, input.role))) {
      throw new ORPCError("BAD_REQUEST", { message: "Role does not exist in this workspace" });
    }

    return withOwnerChangeLock(context.workspaceId, async () => {
      await assertNotLastOwner(context.workspaceId, input.memberId);
      const member = await runBetterAuthOperation(() =>
        auth.api.updateMemberRole({
          body: {
            memberId: input.memberId,
            organizationId: context.workspaceId,
            role: input.role,
          },
          headers: context.headers,
        }),
      );
      return {
        member: {
          id: member.id,
          userId: member.userId,
          organizationId: member.organizationId,
          role: member.role,
        },
      };
    });
  });

/** Removes a member through Better Auth while preserving the workspace's final owner. */
const remove = authedProcedure
  .meta(
    openapi({
      method: "DELETE",
      path: "/members/{memberId}",
      operationId: "removeWorkspaceMember",
      tags: ["Members"],
      summary: "Remove a workspace member",
      description: "Removes a member from its owning workspace.",
    }),
  )
  .input(memberIdInput)
  .use(
    requireWorkspace(
      (input: z.infer<typeof memberIdInput>) => getMemberWorkspaceId(input.memberId),
      { member: ["delete"] },
    ),
  )
  .output(z.object({ member: safeMemberResultSchema }))
  .handler(async ({ input, context }) => {
    requireSession(context);

    return withOwnerChangeLock(context.workspaceId, async () => {
      await assertNotLastOwner(context.workspaceId, input.memberId);
      return runBetterAuthOperation(() =>
        auth.api.removeMember({
          body: {
            memberIdOrEmail: input.memberId,
            organizationId: context.workspaceId,
          },
          headers: context.headers,
        }),
      );
    });
  });

export const invitationRouter = {
  getDetails,
  getPending,
  accept,
  create,
  list,
  capabilities,
  cancel,
};
export const memberRouter = { list: listMembers, updateRole, remove };
export const workspaceRoleRouter = { list: listWorkspaceRoles };
