import { describe, expect, it } from "vitest";
import { isLocalSignInPath } from "./is-local-sign-in-path";

describe("local sign-in paths", () => {
  it.each([
    "/sign-in/anonymous",
    "/sign-in/magic-link",
    "/magic-link/verify",
    "/email-otp/send-verification-otp",
    "/sign-in/email-otp",
  ])("blocks %s when local sign-in is disabled", (path) => {
    expect(isLocalSignInPath(path)).toBe(true);
  });

  it.each(["/sign-in/social", "/sign-in/email", "/email-otp/verify-email", "/get-session"])(
    "leaves %s outside the local sign-in gate",
    (path) => {
      expect(isLocalSignInPath(path)).toBe(false);
    },
  );
});
