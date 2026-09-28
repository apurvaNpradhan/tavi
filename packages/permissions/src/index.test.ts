import { describe, expect, it } from "vitest";
import { builtInRoles, DEFAULT_ROLE_NAMES, defaultRolePayloads, owner, viewer } from "./index";

/**
 * These guard the permission contract shared by the API and the web client.
 * A silent change here changes what every existing workspace can do.
 */
describe("permission vocabulary", () => {
  it("grants viewer read-only access to the workspace", () => {
    const statements = viewer.statements as Record<string, readonly string[]>;
    expect(statements.workspace).toEqual(["read"]);
    expect(statements.workspace).not.toContain("update");
  });

  it("lets owner manage the workspace", () => {
    const statements = owner.statements as Record<string, readonly string[]>;
    expect(statements.workspace).toContain("manage_settings");
    expect(statements.workspace).toContain("delete");
  });

  it("does not seed `owner` as an editable role", () => {
    // Owner stays static so a workspace can never be locked out of its own
    // administration by editing roles.
    expect(DEFAULT_ROLE_NAMES).not.toContain("owner");
  });

  it("ships a JSON-serializable payload for every seeded role", () => {
    for (const name of DEFAULT_ROLE_NAMES) {
      const payload = defaultRolePayloads[name];
      expect(payload).toBeTypeOf("object");
      for (const actions of Object.values(payload)) {
        expect(Array.isArray(actions)).toBe(true);
        expect(actions.every((action) => typeof action === "string")).toBe(true);
      }
    }
  });

  it("exposes every role a workspace can assign", () => {
    expect(Object.keys(builtInRoles).toSorted()).toEqual(["admin", "member", "owner", "viewer"]);
  });
});
