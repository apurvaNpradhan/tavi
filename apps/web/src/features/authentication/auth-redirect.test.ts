import { describe, expect, it } from "vitest";
import { getSafeAuthRedirect } from "./auth-redirect";

describe("getSafeAuthRedirect", () => {
  it("keeps a local destination with its query and fragment", () => {
    expect(getSafeAuthRedirect("/?tab=notes#today")).toBe("/?tab=notes#today");
  });

  it("keeps an absolute URL on the current app origin", () => {
    expect(getSafeAuthRedirect(`${window.location.origin}/?tab=notes`)).toBe("/?tab=notes");
  });

  it.each(["https://example.com", "//example.com/path", "/auth/login", undefined, 42])(
    "falls back for an unsafe destination (%s)",
    (value) => {
      expect(getSafeAuthRedirect(value)).toBe("/");
    },
  );
});
