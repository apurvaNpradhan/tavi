import { describe, expect, it } from "vitest";
import {
  createUniqueWorkspaceSlug,
  createWorkspaceBaseSlug,
  isWorkspaceSlugCollisionError,
} from "./workspace-slug";

describe("workspace slug generation", () => {
  it("normalizes a display name and uses a fallback for empty fragments", () => {
    expect(createWorkspaceBaseSlug("Acme Inc")).toBe("acme-inc");
    expect(createWorkspaceBaseSlug("My_Team")).toBe("my-team");
    expect(createWorkspaceBaseSlug("***")).toBe("workspace");
  });

  it("keeps available slugs readable and suffixes collisions", () => {
    expect(createUniqueWorkspaceSlug("Acme Inc", ["other"])).toBe("acme-inc");
    const slug = createUniqueWorkspaceSlug(
      "Acme Inc",
      ["ACME-INC"],
      () => "12345678-1234-1234-1234-123456789012",
    );
    expect(slug).toBe("acme-inc-123456781234");
  });

  it("recognizes slug collision errors without treating network errors as collisions", () => {
    expect(isWorkspaceSlugCollisionError(new Error("Organization already exists"))).toBe(true);
    expect(isWorkspaceSlugCollisionError(new Error("Organization slug already exists"))).toBe(true);
    expect(isWorkspaceSlugCollisionError(new Error("Invalid slug format"))).toBe(false);
    expect(isWorkspaceSlugCollisionError(new Error("Network down"))).toBe(false);
    expect(isWorkspaceSlugCollisionError(undefined)).toBe(false);
  });
});
