import { useQueryClient } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isSupportedLocale } from "@i18n/resources";
import { DashboardLoadingSkeleton } from "@/features/layout/dashboard-loading-skeleton";
import {
  type AppSession,
  sessionQueryOptions,
  useAppSession,
} from "@/features/authentication/hooks/use-session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  /** Stored onboarding state; route code narrows it before branching. */
  onboardingStep?: string | null;
  /** Stored interface language; narrowed against `supportedLocales` before use. */
  locale?: string | null;
};

export const AuthContext = createContext<{
  user: SessionUser | null | undefined;
  session: AppSession | null | undefined;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}>({
  user: undefined,
  session: undefined,
  isLoading: true,
  refetchUser: async () => {},
});

/**
 * Owns the app's session query.
 *
 * The session lives in the React Query cache under `sessionQueryKey`, which is
 * the same entry route guards read, so mounting the provider and entering a
 * guarded route share one `getSession()` request rather than firing two.
 */
function AuthProvider({ children }: PropsWithChildren) {
  const { t, i18n } = useTranslation("common");
  const queryClient = useQueryClient();
  const { data, isPending } = useAppSession();
  const storedLocale = data?.user?.locale;

  const refetchUser = useCallback(async () => {
    await queryClient.fetchQuery({ ...sessionQueryOptions(), staleTime: 0 });
  }, [queryClient]);

  // Apply the account's stored language once the session lands.
  //
  // `createI18n` initializes in the default locale because the session is not
  // available that early, so without this the interface would only follow the
  // stored preference after the user revisited the picker — the setting would
  // look persisted while every fresh load rendered in English. The document
  // language is kept in step so assistive technology and hyphenation agree with
  // the copy on screen.
  useEffect(() => {
    if (!storedLocale || !isSupportedLocale(storedLocale)) return;

    if (i18n.language !== storedLocale) void i18n.changeLanguage(storedLocale);
    document.documentElement.lang = storedLocale;
  }, [i18n, storedLocale]);

  // Surfaces sign-out in other tabs without a manual reload.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes("better-auth")) void refetchUser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refetchUser]);

  // Only the *first* load shows the shell skeleton; a defined `data` means the
  // first fetch has already landed, and skeletoning later refetches would
  // unmount the route tree.
  if (isPending && data === undefined) {
    return <DashboardLoadingSkeleton label={t("loading")} />;
  }

  return (
    <AuthContext.Provider
      value={{
        user: (data?.user as SessionUser | null | undefined) ?? null,
        session: data,
        isLoading: isPending,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
