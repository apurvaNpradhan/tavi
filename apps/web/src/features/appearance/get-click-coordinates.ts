import type { MouseEvent } from "react";
import type { ThemeCoordinates } from "@/features/appearance/theme";

/**
 * Centre of the pressed control as viewport percentages (0-100).
 *
 * Used as the origin of the theme reveal animation, so the new theme spreads
 * out from the control the user actually pressed.
 */
export function getClickCoordinates(event: MouseEvent<HTMLElement>): ThemeCoordinates {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
    y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
  };
}
