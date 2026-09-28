import { defaultLocale, isSupportedLocale, type AppLocale } from "../../../../i18n/resources";

/** Selects the saved supported locale, then the first supported device locale. */
export function resolveMobileLocale(
  accountLocale: unknown,
  deviceLocales: readonly string[],
): AppLocale {
  if (typeof accountLocale === "string" && isSupportedLocale(accountLocale)) return accountLocale;
  return deviceLocales.find(isSupportedLocale) ?? defaultLocale;
}
