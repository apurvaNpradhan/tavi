import type { RouterHistory } from "@tanstack/react-router";

// History state survives a browser refresh, but this module's ID does not.
// A refreshed settings URL must close to workspace home rather than trusting
// a previous page-load's history origin.
const settingsPageLoadId = crypto.randomUUID();

type SettingsOrigin = {
  pageLoadId: string;
  historyIndex: number;
};

/** Marks the history entry from which the settings dialog was opened. */
export function createSettingsOpenState(state: RouterHistory["location"]["state"]) {
  // oxlint-disable-next-line no-underscore-dangle
  const historyIndex = state.__TSR_index;
  return {
    ...state,
    settingsOrigin: { pageLoadId: settingsPageLoadId, historyIndex },
  } satisfies { settingsOrigin: SettingsOrigin };
}

/**
 * Returns the number of history entries to skip when closing settings.
 * A missing, malformed, or previous-page-load origin means a deep link or a
 * refresh; callers should navigate to workspace home instead.
 */
export function settingsCloseSteps(
  state: RouterHistory["location"]["state"] & { settingsOrigin?: unknown },
): number | null {
  const origin = state.settingsOrigin;
  if (!origin || typeof origin !== "object") return null;
  if (!("pageLoadId" in origin) || origin.pageLoadId !== settingsPageLoadId) return null;
  if (!("historyIndex" in origin) || typeof origin.historyIndex !== "number") return null;
  if (!Number.isSafeInteger(origin.historyIndex) || origin.historyIndex < 0) return null;
  // TanStack History owns this underscored state field; it is not our identifier.
  // oxlint-disable-next-line no-underscore-dangle
  if (!Number.isSafeInteger(state.__TSR_index)) return null;

  // oxlint-disable-next-line no-underscore-dangle
  const steps = state.__TSR_index - origin.historyIndex;
  return steps > 0 ? steps : null;
}
