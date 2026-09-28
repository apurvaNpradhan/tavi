import { type BuiltInRoleName, builtInRoles } from "@tavi/permissions";
import { and, eq } from "drizzle-orm";
import type { Context } from "hono";
import db, { schema } from "../database";
import { isAdministratorUserId } from "./is-instance-admin";

export type PermissionMap = Record<string, string[]>;

type ApiKeyScope = { permissions?: Record<string, string[]> | null } | undefined;

function builtInRoleStatements(role: string): Record<string, readonly string[]> | null {
  if (role in builtInRoles) {
    return builtInRoles[role as BuiltInRoleName].statements as Record<string, readonly string[]>;
  }
  return null;
}

/**
 * Parses a stored `workspace_role.permission` payload defensively.
 *
 * Rows can be edited by admins and may be malformed; anything that is not a
 * `{ resource: string[] }` shape is rejected, so an editable role can never
 * silently regain its compiled-in permissions after corruption.
 */
function parsePermissionStatements(raw: string): Record<string, readonly string[]> | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const result: Record<string, string[]> = {};
  for (const [resource, actions] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(actions) || actions.some((action) => typeof action !== "string")) {
      return null;
    }
    result[resource] = actions;
  }
  return result;
}

async function customRoleStatements(
  workspaceId: string,
  role: string,
): Promise<Record<string, readonly string[]> | null> {
  const [row] = await db
    .select({ permission: schema.workspaceRoleTable.permission })
    .from(schema.workspaceRoleTable)
    .where(
      and(
        eq(schema.workspaceRoleTable.workspaceId, workspaceId),
        eq(schema.workspaceRoleTable.role, role),
      ),
    )
    // The `(workspace_id, role)` unique index guarantees one row; the order is
    // a belt-and-braces guard for a database migrated before that index landed.
    .orderBy(schema.workspaceRoleTable.id)
    .limit(1);

  if (!row?.permission) return null;
  return parsePermissionStatements(row.permission);
}

function satisfies(
  statements: Record<string, readonly string[]>,
  required: PermissionMap,
): boolean {
  for (const [resource, actions] of Object.entries(required)) {
    const granted = statements[resource];
    if (!granted) return false;
    for (const action of actions) {
      if (!granted.includes(action)) return false;
    }
  }
  return true;
}

/**
 * Whether an API key's own scope permits a capability.
 *
 * A key can only ever narrow its owner's access, never widen it, so an
 * insufficient scope denies the request outright.
 */
export function apiKeyScopeAllows(apiKey: ApiKeyScope, permissions: PermissionMap): boolean {
  return !apiKey?.permissions || satisfies(apiKey.permissions, permissions);
}

/**
 * Transport-free capability check shared by the Hono middleware and the oRPC
 * procedures. Prefer this over re-deriving the rule for a new surface.
 */
export async function evaluateWorkspacePermission(
  subject: {
    userId: string;
    workspaceId: string;
    apiKey?: ApiKeyScope;
    isInstanceAdmin: boolean;
  },
  permissions: PermissionMap,
): Promise<boolean> {
  const [result] = await evaluateWorkspacePermissions(subject, [permissions]);
  return result ?? false;
}

/** Evaluates several capabilities after resolving membership and role statements once. */
export async function evaluateWorkspacePermissions(
  subject: {
    userId: string;
    workspaceId: string;
    apiKey?: ApiKeyScope;
    isInstanceAdmin: boolean;
  },
  permissions: readonly PermissionMap[],
): Promise<boolean[]> {
  const scopedPermissions = permissions.map((required) =>
    apiKeyScopeAllows(subject.apiKey, required),
  );
  if (scopedPermissions.every((allowed) => !allowed)) return permissions.map(() => false);

  if (subject.isInstanceAdmin) return scopedPermissions;

  const [member] = await db
    .select({ role: schema.workspaceUserTable.role })
    .from(schema.workspaceUserTable)
    .where(
      and(
        eq(schema.workspaceUserTable.workspaceId, subject.workspaceId),
        eq(schema.workspaceUserTable.userId, subject.userId),
      ),
    )
    .orderBy(schema.workspaceUserTable.id)
    .limit(1);

  if (!member?.role) return permissions.map(() => false);

  const statements =
    member.role === "owner"
      ? builtInRoleStatements(member.role)
      : await customRoleStatements(subject.workspaceId, member.role);
  return permissions.map((required, index) =>
    Boolean(scopedPermissions[index] && statements && satisfies(statements, required)),
  );
}

/**
 * Checks a capability without throwing. Use when the answer is informational,
 * e.g. deciding whether to expose a "share" control in a response.
 */
export async function hasWorkspacePermission(
  c: Context,
  permissions: PermissionMap,
): Promise<boolean> {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  if (!workspaceId || !userId) return false;

  const apiKey = c.get("apiKey") as { permissions?: Record<string, string[]> | null } | undefined;

  return evaluateWorkspacePermission(
    {
      userId,
      workspaceId,
      apiKey,
      isInstanceAdmin: apiKey?.permissions ? false : await isAdministratorUserId(userId),
    },
    permissions,
  );
}
