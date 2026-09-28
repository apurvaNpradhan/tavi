import { Image, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Button, Text, useThemeMode } from "panelui-native";
import { ChevronRightIcon } from "panelui-native/icons";
import { AuthBackdrop } from "../components/auth-backdrop";

/**
 * Branded welcome screen.
 *
 * One way in, rather than a copy of the sign-in methods: the sign-in screen
 * reads the auth configuration and decides what is actually available, so this
 * screen has nothing to load and nothing that can fail.
 */
export default function WelcomeScreen() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useThemeMode();

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <AuthBackdrop />
      <View className="flex-1 justify-center gap-10 px-6 py-10">
        <View className="mx-auto w-full max-w-md items-center gap-6">
          <Image
            source={
              mode === "dark"
                ? require("../../../assets/logo-dark.png")
                : require("../../../assets/logo-light.png")
            }
            className="h-24 w-24"
            resizeMode="contain"
            accessible={false}
            accessibilityIgnoresInvertColors
          />
          <View className="gap-2">
            <Text className="text-center text-3xl font-bold text-foreground">
              {t("loginTitle")}
            </Text>
            <Text className="font-normal text-center text-base text-muted-foreground">
              {t("tagline")}
            </Text>
          </View>
        </View>

        <View className="mx-auto w-full max-w-md">
          <Button
            fullWidth
            endContent={<ChevronRightIcon size={16} />}
            onPress={() => router.push("/(auth)/sign-in")}
          >
            {t("getStarted")}
          </Button>
        </View>
      </View>
    </View>
  );
}
