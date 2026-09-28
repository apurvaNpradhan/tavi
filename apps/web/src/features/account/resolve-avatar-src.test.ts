import { describe, expect, it } from "vitest";
import { resolveAvatarSrc } from "./resolve-avatar-src";

const ORIGIN = "https://api.example.com";

describe("resolveAvatarSrc", () => {
  it("anchors a stored API-relative avatar to the API origin", () => {
    expect(resolveAvatarSrc("/api/user/avatar/abc123", ORIGIN)).toBe(
      "https://api.example.com/api/user/avatar/abc123",
    );
  });

  it("passes a provider URL through untouched", () => {
    const provider = "https://lh3.googleusercontent.com/a/ABC123";
    expect(resolveAvatarSrc(provider, ORIGIN)).toBe(provider);
  });

  it("passes through anything that is not API-relative", () => {
    expect(resolveAvatarSrc("/other/path.png", ORIGIN)).toBe("/other/path.png");
    expect(resolveAvatarSrc("", ORIGIN)).toBe("");
    expect(resolveAvatarSrc(undefined, ORIGIN)).toBeUndefined();
  });
});
