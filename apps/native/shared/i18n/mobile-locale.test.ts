import { describe, expect, it } from "vitest";
import { resolveMobileLocale } from "./mobile-locale";

describe("mobile locale selection", () => {
  it("prefers the saved account locale when this build supports it", () => {
    expect(resolveMobileLocale("en-US", [])).toBe("en-US");
  });

  it("uses the first supported device locale before falling back to English", () => {
    expect(resolveMobileLocale(undefined, ["fr-FR", "en-US"])).toBe("en-US");
    expect(resolveMobileLocale(undefined, ["fr-FR"])).toBe("en-US");
  });

  it("ignores an account locale that this build does not ship", () => {
    expect(resolveMobileLocale("fr-FR", ["en-US"])).toBe("en-US");
  });
});
