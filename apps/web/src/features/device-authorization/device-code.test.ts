import { describe, expect, it } from "vitest";
import {
  deviceErrorDescription,
  isSubmittableUserCode,
  MIN_USER_CODE_LENGTH,
  normalizeUserCode,
} from "./device-code";

describe("normalizeUserCode", () => {
  it("uppercases and keeps the characters a code is made of", () => {
    expect(normalizeUserCode("abcd1234")).toBe("ABCD1234");
  });

  it("drops the grouping dash, wherever it was typed", () => {
    expect(normalizeUserCode("ABCD-1234")).toBe("ABCD1234");
    expect(normalizeUserCode(" AB CD - 12 34 ")).toBe("ABCD1234");
  });

  it("drops characters that cannot appear in a code", () => {
    expect(normalizeUserCode("AB_CD!12/34")).toBe("ABCD1234");
  });

  it("returns an empty string for anything that is not a string", () => {
    expect(normalizeUserCode(undefined)).toBe("");
    expect(normalizeUserCode(null)).toBe("");
    expect(normalizeUserCode(12_34)).toBe("");
  });
});

describe("isSubmittableUserCode", () => {
  it("accepts a code at the minimum length and above", () => {
    expect(isSubmittableUserCode("A".repeat(MIN_USER_CODE_LENGTH))).toBe(true);
    expect(isSubmittableUserCode("ABCD1234")).toBe(true);
  });

  it("rejects anything shorter", () => {
    expect(isSubmittableUserCode("A".repeat(MIN_USER_CODE_LENGTH - 1))).toBe(false);
    expect(isSubmittableUserCode("")).toBe(false);
  });
});

describe("deviceErrorDescription", () => {
  it("reads the OAuth-style description the plugin returns", () => {
    expect(
      deviceErrorDescription({
        error: "expired_token",
        error_description: "user code has expired",
      }),
    ).toBe("user code has expired");
  });

  it("is null when there is nothing to show", () => {
    expect(deviceErrorDescription({ error: "invalid_request" })).toBeNull();
    expect(deviceErrorDescription({ error_description: "" })).toBeNull();
    expect(deviceErrorDescription(new Error("network"))).toBeNull();
    expect(deviceErrorDescription(undefined)).toBeNull();
  });
});
