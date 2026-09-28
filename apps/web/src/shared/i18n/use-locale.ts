import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  defaultLocale,
  isSupportedLocale,
  type AppLocale,
  supportedLocales,
} from "@i18n/resources";
import { useAuth } from "@/shared/providers/auth-provider/hooks/use-auth";
import { type AppSession, sessionQueryKey } from "@/features/authentication/hooks/use-session";
import { authClient } from "@/shared/auth/auth-client";
import { normalizeClientError } from "@/shared/api/http-error";

export { supportedLocales, type AppLocale };

/** Human-readable name for a locale, falling back to the tag itself. */
export function getLocaleLabel(locale: AppLocale) {
  try {
    const language = new Intl.Locale(locale).language;
    return new Intl.DisplayNames([locale], { type: "language" }).of(language) ?? locale;
  } catch {
    return locale;
  }
}

/**
 * The interface language, persisted on the user so it follows them between
 * devices.
 *
 * The stored value is treated as untrusted: a locale this build does not ship
 * (an older client, a hand-edited row) falls back to the default instead of
 * leaving i18next asked for a bundle that does not exist.
 *
 * The server is written first. Switching the UI before the write would leave the
 * two disagreeing whenever the request failed, and the next load would silently
 * revert.
 */
export function useLocale() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const stored = user?.locale;
  const locale: AppLocale = stored && isSupportedLocale(stored) ? stored : defaultLocale;

  async function setLocale(next: AppLocale) {
    setIsPending(true);
    try {
      const { error } = await authClient.updateUser({ locale: next });

      if (error) {
        throw normalizeClientError(error, "Could not change the language");
      }

      queryClient.setQueryData<AppSession | null | undefined>(
        sessionQueryKey,
        (current: AppSession | null | undefined) => {
          if (!current) return current;
          return { ...current, user: { ...current.user, locale: next } };
        },
      );
      await i18n.changeLanguage(next);
    } finally {
      setIsPending(false);
    }
  }

  return { locale, setLocale, isPending };
}
