import type auth from "@i18n/en-US/auth.json";
import type common from "@i18n/en-US/common.json";
import type dashboard from "@i18n/en-US/dashboard.json";
import type notifications from "@i18n/en-US/notifications.json";
import type settings from "@i18n/en-US/settings.json";
import type workspace from "@i18n/en-US/workspace.json";

/**
 * Types `t()` from the English source bundle.
 *
 * `react-i18next` reads `CustomTypeOptions.resources`, so every key is checked
 * at compile time and `useTranslation("workspace")` narrows `t` to that
 * namespace. English is the source of truth: a key that exists in another
 * locale but not here is drift, and `pnpm i18n:check` fails on it.
 */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof common;
      auth: typeof auth;
      dashboard: typeof dashboard;
      notifications: typeof notifications;
      settings: typeof settings;
      workspace: typeof workspace;
    };
  }
}
