import "../instrument";
import "../global.css";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import * as SystemUI from "expo-system-ui";
import * as Sentry from "@sentry/react-native";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button, PanelUIProvider, useThemeMode } from "panelui-native";
import { useCSSVariable } from "uniwind";
import { MobileI18nProvider } from "../shared/i18n/mobile-i18n-provider";
import { resolveMobileAccess } from "../features/auth/mobile-access";
import { orpc } from "../shared/api-client";
import { sessionQueryOptions } from "../features/auth/session";
import { workspacesQueryOptions } from "../features/workspaces/workspaces";
import { configureNativeQueryLifecycle, queryClient } from "../shared/query-client";

configureNativeQueryLifecycle();

/** Reports route render failures and offers Expo Router's retry action. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  const { t } = useTranslation("common");

  useEffect(() => {
    Sentry.captureException(error, { tags: { area: "expo-router" } });
  }, [error]);

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
      <Text className="text-lg font-semibold text-foreground">{t("errorTitle")}</Text>
      <Text className="font-normal text-center text-muted-foreground">{t("errorDescription")}</Text>
      <Button onPress={() => void retry()}>{t("retry")}</Button>
    </View>
  );
}

function SessionNavigation() {
  const { mode } = useThemeMode();
  const { t } = useTranslation(["auth", "common"]);
  const session = useQuery(sessionQueryOptions());
  const workspaces = useQuery({ ...workspacesQueryOptions(), enabled: Boolean(session.data) });
  const config = useQuery({
    ...orpc.config.get.queryOptions(),
    enabled: Boolean(session.data) && workspaces.data?.length === 0,
  });
  const [background, card, text, border, primary] = useCSSVariable([
    "--color-background",
    "--color-card",
    "--color-foreground",
    "--color-border",
    "--color-primary",
  ]) as (string | undefined)[];

  useEffect(() => {
    if (background) void SystemUI.setBackgroundColorAsync(background);
  }, [background]);

  const access = resolveMobileAccess({ session, workspaces, config });

  if (access.kind === "pending") {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background">
        <ActivityIndicator />
        <Text className="font-normal text-muted-foreground">{t("common:loading")}</Text>
      </View>
    );
  }

  if (access.kind === "error") {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Text className="text-center text-lg font-semibold text-foreground">
          {t("auth:mobile.connectionTitle")}
        </Text>
        <Text className="font-normal text-center text-muted-foreground">
          {t("auth:mobile.connectionDescription")}
        </Text>
        <Button
          onPress={() => {
            void session.refetch();
            void workspaces.refetch();
            void config.refetch();
          }}
        >
          {t("auth:mobile.retry")}
        </Button>
      </View>
    );
  }

  const base = mode === "dark" ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    dark: mode === "dark",
    colors: {
      ...base.colors,
      ...(background ? { background } : null),
      ...(card ? { card } : null),
      ...(text ? { text } : null),
      ...(border ? { border } : null),
      ...(primary ? { primary, notification: primary } : null),
    },
  };

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={access.kind === "signedOut"}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={access.kind === "onboarding"}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={access.kind === "ready"}>
          <Stack.Screen name="(authenticated)" />
        </Stack.Protected>
      </Stack>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

/** Root providers and protected navigation for the native app. */
function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
  });

  if (fontError) throw fontError;
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <MobileI18nProvider>
          <PanelUIProvider>
            <SessionNavigation />
          </PanelUIProvider>
        </MobileI18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
