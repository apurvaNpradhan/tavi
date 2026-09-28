import { afterEach, describe, expect, it } from "vitest";
import { applyTheme, resolveTheme } from "./theme";

describe("theme preference", () => {
  afterEach(() => {
    document.documentElement.classList.remove("light", "dark");
  });

  it.each([
    ["light", true, "light"],
    ["light", false, "light"],
    ["dark", true, "dark"],
    ["dark", false, "dark"],
    ["system", true, "dark"],
    ["system", false, "light"],
  ] as const)(
    "resolves %s with an OS dark preference of %s to %s",
    (theme, prefersDark, expected) => {
      expect(resolveTheme(theme, prefersDark)).toBe(expected);
    },
  );

  it("replaces the previous class rather than stacking both", () => {
    applyTheme("dark", false);
    expect(document.documentElement).toHaveClass("dark");

    applyTheme("light", false);
    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("follows the OS preference while the preference is system", () => {
    applyTheme("system", true);
    expect(document.documentElement).toHaveClass("dark");

    applyTheme("system", false);
    expect(document.documentElement).toHaveClass("light");
  });
});
