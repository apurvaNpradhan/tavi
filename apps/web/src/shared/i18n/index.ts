import {
  defaultLocale,
  isNamespace,
  isSupportedLocale,
  loadNamespace,
  namespaces,
  supportedLocales,
} from "@i18n/resources";
import common from "@i18n/en-US/common.json";
import i18n from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

const initialResources = { "en-US": { common } } as const;

export { namespaces };

/**
 * Loads namespaces on demand.
 *
 * Common copy is initialized synchronously. Feature namespaces use one dynamic
 * import per namespace and are loaded by `useTranslation` when a route renders.
 *
 * i18next asks a backend for one namespace at a time and stores the answer as
 * that namespace's bundle. An unknown language or namespace must resolve to an
 * empty object rather than throw: a failed optional bundle shows the safe
 * English key fallback instead of leaving the application suspended forever.
 */
export function createI18n() {
  const instance = i18n.createInstance();

  const init = instance
    .use(
      resourcesToBackend((language: string, namespace: string) => {
        if (!isSupportedLocale(language) || !isNamespace(namespace)) {
          return {};
        }

        return loadNamespace(language, namespace).catch(() => ({}));
      }),
    )
    .use(initReactI18next)
    .init({
      lng: defaultLocale,
      // Every shipped locale, not just the default: `changeLanguage` silently
      // refuses a language outside `supportedLngs`, which would make the locale
      // picker look like it worked while nothing changed.
      supportedLngs: [...supportedLocales],
      load: "currentOnly",
      partialBundledLanguages: true,
      fallbackLng: defaultLocale,
      resources: initialResources,
      ns: ["common"],
      defaultNS: "common",
      interpolation: {
        // React escapes interpolated values already.
        escapeValue: false,
      },
    });

  return { instance, init };
}
