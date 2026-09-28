/** Theme resolution shared by the store and the provider. */
export type Theme = "light" | "dark" | "system";

/** Viewport percentage of a theme switch, used as the reveal origin. */
export type ThemeCoordinates = { x: number; y: number };

/**
 * Maps a stored theme preference onto the class that goes on `<html>`.
 *
 * Kept in one place so the class applied on a theme switch and the class
 * applied when the OS scheme changes cannot disagree.
 */
export function resolveTheme(theme: Theme, prefersDark: boolean): "light" | "dark" {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}

/** Reads the operating system colour scheme preference. */
export function prefersDarkScheme(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Puts the resolved theme class on `<html>` and removes the other one.
 *
 * The class lives on the document element rather than a wrapper so portalled
 * content (dialogs, menus, toasts) inherits it too.
 */
export function applyTheme(theme: Theme, prefersDark = prefersDarkScheme()): "light" | "dark" {
  const resolved = resolveTheme(theme, prefersDark);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  return resolved;
}
