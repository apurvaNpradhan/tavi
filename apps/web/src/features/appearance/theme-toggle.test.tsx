import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { AppI18nProvider } from "@/shared/i18n/provider";
import { useUserPreferencesStore } from "@/features/appearance/user-preferences";
import { ThemeToggle } from "./theme-toggle";

function renderThemeToggle() {
  return render(
    <AppI18nProvider>
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    </AppI18nProvider>,
  );
}

describe("theme toggle", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("light", "dark");
  });

  afterEach(() => {
    document.documentElement.classList.remove("light", "dark");
    Reflect.deleteProperty(document, "startViewTransition");
  });

  it("switches the document theme and relabels itself", () => {
    useUserPreferencesStore.setState({ theme: "light" });
    renderThemeToggle();
    expect(document.documentElement).toHaveClass("light");

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("records the pressed control as the reveal origin", () => {
    useUserPreferencesStore.setState({ theme: "dark" });
    renderThemeToggle();

    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));

    expect(document.documentElement.style.getPropertyValue("--theme-x")).toMatch(/%$/);
    expect(document.documentElement.style.getPropertyValue("--theme-y")).toMatch(/%$/);
  });

  it("routes the switch through a view transition when the browser supports it", () => {
    const startViewTransition = vi.fn<(update: () => void) => { finished: Promise<void> }>(
      (update) => {
        update();
        return { finished: Promise.resolve() };
      },
    );
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });

    useUserPreferencesStore.setState({ theme: "light" });
    renderThemeToggle();

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(startViewTransition).toHaveBeenCalledOnce();
    expect(document.documentElement).toHaveClass("dark");
  });
});
