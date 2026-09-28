import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyTheme, type Theme, type ThemeCoordinates } from "@/features/appearance/theme";

export type { Theme };

type UserPreferencesState = {
  theme: Theme;
  /** Switches theme, optionally revealing the new one from a pressed control. */
  setTheme: (theme: Theme, coordinates?: ThemeCoordinates) => void;
};

/**
 * Local-only UI preferences.
 *
 * These are deliberately not on the server: they are per-device presentation
 * choices, and keeping them local means the UI renders correctly on first paint
 * without waiting for a request.
 */
export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme, coordinates) => {
        const root = document.documentElement;

        // The reveal origin for `::view-transition-new(root)`. Cleared for
        // switches with no pointer behind them (an OS scheme change, a
        // keyboard action) so the reveal falls back to the screen centre.
        if (coordinates) {
          root.style.setProperty("--theme-x", `${coordinates.x}%`);
          root.style.setProperty("--theme-y", `${coordinates.y}%`);
        } else {
          root.style.removeProperty("--theme-x");
          root.style.removeProperty("--theme-y");
        }

        const commit = () => {
          // Applied before the browser captures the "new" snapshot, otherwise
          // the reveal would animate towards the theme already on screen. The
          // provider's effect reconciles afterwards and is idempotent.
          applyTheme(theme);
          set({ theme });
        };

        // View Transitions turn the switch into a reveal from the pressed
        // control. Browsers without the API swap instantly.
        if (typeof document.startViewTransition === "function") {
          document.startViewTransition(commit);
          return;
        }

        commit();
      },
    }),
    {
      name: "tavi:preferences",
      partialize: ({ theme }) => ({ theme }),
    },
  ),
);
