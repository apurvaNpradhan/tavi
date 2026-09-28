import { useState } from "react";
import { Text, View } from "react-native";
import * as Linking from "expo-linking";
import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";
import { signOut } from "../../auth/sign-out";
import { webBaseUrl } from "../../../shared/runtime-config";

/** Explains that this account needs an invitation when workspace creation is disabled. */
export default function InvitationNeededScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const [signOutError, setSignOutError] = useState(false);

  async function handleSignOut() {
    setSignOutError(false);
    try {
      await signOut();
    } catch {
      setSignOutError(true);
    }
  }

  return (
    <View className="flex-1 justify-center bg-background px-6 py-8">
      <Card className="mx-auto w-full max-w-md">
        <Card.Header>
          <Card.Title>{t("auth:mobile.noWorkspace")}</Card.Title>
          <Card.Description>{t("auth:mobile.workspaceUnavailable")}</Card.Description>
        </Card.Header>
        <Card.Content className="gap-3">
          {signOutError ? (
            <Text className="font-normal text-destructive" accessibilityRole="alert">
              {t("auth:mobile.signOutFailed")}
            </Text>
          ) : null}
          <Button fullWidth onPress={() => void Linking.openURL(webBaseUrl)}>
            {t("auth:mobile.openWeb")}
          </Button>
          <Button fullWidth variant="outline" onPress={() => void handleSignOut()}>
            {t("auth:mobile.signOut")}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
