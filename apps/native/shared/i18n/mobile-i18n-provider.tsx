import { useEffect, useState } from "react";
import { Suspense } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { I18nextProvider, useTranslation } from "react-i18next";
import { useLocales } from "expo-localization";
import { useQuery } from "@tanstack/react-query";
import { mobileI18n, mobileI18nReady } from "./mobile-i18n";
import { resolveMobileLocale } from "./mobile-locale";
import { sessionQueryOptions } from "../../features/auth/session";

function LoadingCopy() {
  const { t } = useTranslation("common");
  return <Text className="font-normal text-sm text-muted-foreground">{t("loading")}</Text>;
}

function AccountLocaleSync() {
  const locales = useLocales();
  const { data: session } = useQuery(sessionQueryOptions());
  const accountLocale = session?.user && "locale" in session.user ? session.user.locale : undefined;
  const locale = resolveMobileLocale(
    accountLocale,
    locales.map((item) => item.languageTag),
  );

  useEffect(() => {
    if (mobileI18n.language !== locale) void mobileI18n.changeLanguage(locale);
  }, [locale]);

  return null;
}

/** Provides the shared Tavi translations, initialized from Expo device locale. */
export function MobileI18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={mobileI18n}>
      <Suspense
        fallback={
          <View className="flex-1 items-center justify-center gap-3 bg-background">
            <ActivityIndicator />
            <LoadingCopy />
          </View>
        }
      >
        <LocaleReady>{children}</LocaleReady>
      </Suspense>
    </I18nextProvider>
  );
}

function LocaleReady({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void mobileI18nReady.then(() => setReady(true));
  }, []);

  if (!ready) return <LoadingCopy />;
  return (
    <>
      <AccountLocaleSync />
      {children}
    </>
  );
}
