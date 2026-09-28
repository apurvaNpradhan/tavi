import { describe, expect, it } from "vitest";
import { canViewPendingInvitations, memberRoleOptions } from "./member-management";

describe("workspace member management visibility", () => {
  it("does not load invitations for a viewer", () => {
    expect(canViewPendingInvitations(true, false, false)).toBe(false);
  });

  it("allows a cancel-only manager to see pending invitations", () => {
    expect(canViewPendingInvitations(true, false, true)).toBe(true);
  });

  it("offers custom roles while keeping the current role and protecting owner", () => {
    expect(memberRoleOptions(["viewer", "custom-reviewer", "owner"], "legacy-role")).toEqual([
      "viewer",
      "custom-reviewer",
      "legacy-role",
    ]);
  });
});
