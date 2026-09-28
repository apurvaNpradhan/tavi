import {
  defaultLocale,
  isNamespace,
  isSupportedLocale,
  loadNamespace,
  namespaces,
  supportedLocales,
} from "../../../../i18n/resources";
import common from "../../../../i18n/en-US/common.json";
import i18n from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { resolveMobileLocale } from "./mobile-locale";

const deviceLocale = resolveMobileLocale(
  undefined,
  getLocales().map((locale) => locale.languageTag),
);
const mobileI18n = i18n.createInstance();

/** Initialization promise shared by the native localization provider. */
export const mobileI18nReady = mobileI18n
  .use(
    resourcesToBackend((language: string, namespace: string) => {
      if (!isSupportedLocale(language) || !isNamespace(namespace)) return {};
      return loadNamespace(language, namespace).catch(() => ({}));
    }),
  )
  .use(initReactI18next)
  .init({
    lng: deviceLocale,
    supportedLngs: [...supportedLocales],
    load: "currentOnly",
    partialBundledLanguages: true,
    fallbackLng: defaultLocale,
    resources: { "en-US": { common } },
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });

/** Shared native translation instance and namespace registry. */
export { mobileI18n, namespaces };
