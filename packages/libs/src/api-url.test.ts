import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "./api-url";

describe("resolveApiBaseUrl", () => {
  it("falls back to the local API when unset", () => {
    expect(resolveApiBaseUrl(undefined)).toBe("http://localhost:1337/api");
  });

  it("appends the /api suffix", () => {
    expect(resolveApiBaseUrl("https://api.example.com")).toBe("https://api.example.com/api");
  });

  it("does not double the suffix when it is already present", () => {
    expect(resolveApiBaseUrl("https://api.example.com/api")).toBe("https://api.example.com/api");
  });

  it("strips a trailing slash before appending", () => {
    expect(resolveApiBaseUrl("https://api.example.com/")).toBe("https://api.example.com/api");
  });

  it("treats a blank value as unset", () => {
    expect(resolveApiBaseUrl("   ")).toBe("http://localhost:1337/api");
  });
});
