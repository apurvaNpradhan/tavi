import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * The canonical permission vocabulary for the whole app.
 *
 * Both the API (`apps/api/src/auth.ts`, `requireWorkspacePermission`) and the web
 * client (`apps/web/src/shared/auth/auth-client.ts`, capability checks) import this map,
 * so a capability is never spelled differently on the two sides.
 *
 * Adding a resource here is a deliberate act: every action you list becomes
 * grantable to custom roles and checkable via `requireWorkspacePermission`.
 */
export const statement = {
  ...defaultStatements,
  workspace: ["read", "update", "delete", "manage_settings"],
} as const;

export const ac = createAccessControl(statement);

export const viewer = ac.newRole({
  ...memberAc.statements,
  workspace: ["read"],
});

export const member = ac.newRole({
  ...memberAc.statements,
  workspace: ["read"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  workspace: ["read", "update", "manage_settings"],
});

export const owner = ac.newRole({
  ...ownerAc.statements,
  workspace: ["read", "update", "delete", "manage_settings"],
});

export const builtInRoles = { viewer, member, admin, owner } as const;

export type BuiltInRoleName = keyof typeof builtInRoles;

/**
 * Default roles that are seeded per workspace as editable `workspace_role` rows.
 * `owner` is intentionally absent: it stays a static Better Auth role so the
 * workspace creator can never lock themselves out.
 */
export const DEFAULT_ROLE_NAMES = ["viewer", "member", "admin"] as const;
export type DefaultRoleName = (typeof DEFAULT_ROLE_NAMES)[number];

/**
 * Copies a role's `statements` into a JSON-serializable shape.
 *
 * `statements` is `readonly string[]` (Better Auth's access-control type) while
 * the stored `workspace_role.permission` column is plain JSON, so the arrays
 * must be materialized as mutable copies.
 */
function toMutablePayload(statements: Record<string, readonly string[]>) {
  const out: Record<string, string[]> = {};
  for (const [resource, actions] of Object.entries(statements)) {
    out[resource] = [...actions];
  }
  return out;
}

/**
 * JSON-serializable permission payloads for the seeded default roles. Mirrors
 * each role's `.statements` (including Better Auth's own organization/member/
 * team/invitation/ac defaults) so a `workspace_role` row seeded from here has
 * parity with the compiled-in definition.
 */
export const defaultRolePayloads: Record<DefaultRoleName, Record<string, string[]>> = {
  viewer: toMutablePayload(viewer.statements),
  member: toMutablePayload(member.statements),
  admin: toMutablePayload(admin.statements),
};
