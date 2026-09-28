import { MoonIcon, SunIcon } from "lucide-react";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { getClickCoordinates } from "./get-click-coordinates";
import { prefersDarkScheme, resolveTheme } from "@/features/appearance/theme";
import { useUserPreferencesStore } from "@/features/appearance/user-preferences";

/**
 * Switches between light and dark, revealed from the button that was pressed.
 *
 * A stored `system` preference resolves to whatever is already on screen, so the
 * first press always flips the theme the user is looking at rather than
 * silently keeping it.
 */
export function ThemeToggle() {
  const { t } = useTranslation("common");
  const theme = useUserPreferencesStore((state) => state.theme);
  const setTheme = useUserPreferencesStore((state) => state.setTheme);
  const isDark = resolveTheme(theme, prefersDarkScheme()) === "dark";

  function toggleTheme(event: MouseEvent<HTMLButtonElement>) {
    setTheme(isDark ? "light" : "dark", getClickCoordinates(event));
  }

  return (
    <Button
      aria-label={t(isDark ? "switchToLightTheme" : "switchToDarkTheme")}
      onClick={toggleTheme}
      size="icon"
      type="button"
      variant="ghost"
    >
      {isDark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  );
}
