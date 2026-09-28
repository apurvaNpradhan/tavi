import { useEffect } from "react";
import { applyTheme } from "@/features/appearance/theme";
import { useUserPreferencesStore } from "@/features/appearance/user-preferences";

/**
 * Keeps the theme class on `<html>` in step with the stored preference.
 *
 * A stored `system` preference is the only case that needs a listener: while it
 * is selected, an OS scheme change must re-resolve the class. The store also
 * applies the class when a switch is made, so the reveal animation captures the
 * new theme; applying it again here is harmless.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUserPreferencesStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);

    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSchemeChange = () => applyTheme("system", media.matches);
    media.addEventListener("change", onSchemeChange);
    return () => media.removeEventListener("change", onSchemeChange);
  }, [theme]);

  return <>{children}</>;
}
