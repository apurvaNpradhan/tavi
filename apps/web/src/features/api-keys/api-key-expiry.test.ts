import { describe, expect, it } from "vitest";
import { apiKeyExpirySeconds, toApiKeyCreateRequest } from "./api-key-expiry";

describe("apiKeyExpirySeconds", () => {
  it("converts the picker lifetime from days to Better Auth seconds", () => {
    expect(apiKeyExpirySeconds(30)).toBe(30 * 86_400);
    expect(apiKeyExpirySeconds(90)).toBe(90 * 86_400);
    expect(apiKeyExpirySeconds(365)).toBe(365 * 86_400);
  });

  it("leaves an unbounded key without an expiry", () => {
    expect(apiKeyExpirySeconds(null)).toBeUndefined();
  });

  it("builds the Better Auth request payload in seconds", () => {
    expect(toApiKeyCreateRequest({ name: "automation", expiresInDays: 30 })).toEqual({
      name: "automation",
      expiresIn: 30 * 86_400,
    });
    expect(toApiKeyCreateRequest({})).toEqual({ name: undefined, expiresIn: undefined });
  });
});
