import { ORPCError } from "@orpc/server";
import { isAdministratorUserId } from "../utils/is-instance-admin";
import {
  apiKeyScopeAllows,
  evaluateWorkspacePermission,
  type PermissionMap,
} from "../utils/require-workspace-permission";
import { validateWorkspaceAccess } from "../utils/validate-workspace-access";
import { authedProcedure } from "./base";

/**
 * Resolves and authorizes the workspace a request targets.
 *
 * The workspace is resolved from the resource when possible, membership is
 * always proven, and the capability is checked against the role map. The
 * resolved id is injected into the context so handlers never trust the caller's
 * copy. An array of permission maps means any map may authorize; actions within
 * each map remain an all-required check.
 */
export function requireWorkspace<TInput>(
  resolveWorkspaceId: (input: TInput) => string | null | Promise<string | null>,
  permissions?: PermissionMap | readonly PermissionMap[],
) {
  return authedProcedure.middleware(async ({ context, next }, input: TInput) => {
    const workspaceId = await resolveWorkspaceId(input);

    if (!workspaceId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Workspace ID could not be determined",
      });
    }

    // Throws 403 when the caller is not a member (or an API key cannot act for
    // its owner); the error boundary converts it to the matching ORPCError.
    await validateWorkspaceAccess(context.userId, workspaceId, context.apiKey?.id);

    if (permissions) {
      const alternatives = Array.isArray(permissions) ? permissions : [permissions];
      const subject = {
        userId: context.userId,
        workspaceId,
        apiKey: context.apiKey,
        isInstanceAdmin: context.apiKey?.permissions
          ? false
          : await isAdministratorUserId(context.userId),
      };
      const allowed = await Promise.all(
        alternatives.map(async (required) => {
          if (!apiKeyScopeAllows(context.apiKey, required)) return false;
          return evaluateWorkspacePermission(subject, required);
        }),
      ).then((results) => results.some(Boolean));

      if (!allowed) {
        throw new ORPCError("FORBIDDEN", { message: "Insufficient permissions" });
      }
    }

    return next({ context: { workspaceId } });
  });
}
