/**
 * Locale registry.
 *
 * Kept outside the app so tooling (the drift checker, the schema generator) and
 * the web bundle share one source of truth. Each namespace is its own file
 * under `i18n/<locale>/`, which is what lets i18n Ally resolve `t("heading")`
 * inside `useTranslation("workspace")` and what lets the type augmentation in
 * `apps/web/src/types/i18next.d.ts` read the resources per namespace.
 */
export const supportedLocales = ["en-US"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = "en-US";

/** Namespaces are the file names directly under each locale directory. */
export const namespaces = [
  "common",
  "auth",
  "dashboard",
  "notifications",
  "settings",
  "workspace",
] as const;

export type AppNamespace = (typeof namespaces)[number];

export function isSupportedLocale(locale: string): locale is AppLocale {
  return (supportedLocales as readonly string[]).includes(locale);
}

export function isNamespace(candidate: string): candidate is AppNamespace {
  return (namespaces as readonly string[]).includes(candidate);
}

/** One dynamic import per feature namespace keeps route copy out of first paint. */
const loaders: Record<AppLocale, Partial<Record<AppNamespace, () => Promise<object>>>> = {
  "en-US": {
    auth: async () => (await import("./en-US/auth.json")).default,
    dashboard: async () => (await import("./en-US/dashboard.json")).default,
    notifications: async () => (await import("./en-US/notifications.json")).default,
    settings: async () => (await import("./en-US/settings.json")).default,
    workspace: async () => (await import("./en-US/workspace.json")).default,
  },
};

export function loadNamespace(locale: AppLocale, namespace: AppNamespace): Promise<object> {
  return loaders[locale][namespace]?.() ?? Promise.resolve({});
}
