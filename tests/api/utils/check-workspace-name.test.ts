import { describe, expect, it } from "vitest";
import { checkWorkspaceName } from "../../../apps/api/src/utils/check-workspace-name";

describe("checkWorkspaceName", () => {
  it("accepts a normal name", () => {
    expect(checkWorkspaceName("Acme")).toEqual({ ok: true });
  });

  it("measures the trimmed value, not the raw input", () => {
    expect(checkWorkspaceName("  ab  ")).toEqual({ ok: true });
  });

  it("rejects a name that is too short once trimmed", () => {
    const result = checkWorkspaceName(" a ");
    expect(result.ok).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(checkWorkspaceName("").ok).toBe(false);
  });

  it("rejects a name over the length limit", () => {
    expect(checkWorkspaceName("x".repeat(49)).ok).toBe(false);
  });

  it("accepts a name exactly at the length limit", () => {
    expect(checkWorkspaceName("x".repeat(48)).ok).toBe(true);
  });
});
