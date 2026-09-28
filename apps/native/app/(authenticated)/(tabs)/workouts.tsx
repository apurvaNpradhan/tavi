import { View } from "react-native";
import * as Linking from "expo-linking";
import { Button, EmptyState } from "panelui-native";
import { Dumbbell } from "lucide-react-native";
import { useCSSVariable } from "uniwind";
import { useTranslation } from "react-i18next";
import { webBaseUrl } from "../../../shared/runtime-config";

/** Honest placeholder until workout domain data is available on the native client. */
export default function WorkoutsScreen() {
  const { t } = useTranslation(["settings", "auth"]);
  const muted = useCSSVariable("--color-muted-foreground") as string;

  return (
    <View className="flex-1 bg-background">
      <EmptyState size="lg" className="px-6 pb-40">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Dumbbell size={20} color={muted} strokeWidth={2} />
          </EmptyState.Media>
          <EmptyState.Title>{t("settings:mobile.workoutsTitle")}</EmptyState.Title>
          <EmptyState.Description>
            {t("settings:mobile.workoutsDescription")}
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button variant="outline" onPress={() => void Linking.openURL(webBaseUrl)}>
            {t("auth:mobile.openWeb")}
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </View>
  );
}
