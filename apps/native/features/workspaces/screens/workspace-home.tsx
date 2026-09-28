import { ScrollView, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, EmptyState, Frame, Spinner } from "panelui-native";
import { Building, ExternalLink } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useCSSVariable } from "uniwind";
import { workspacesQueryOptions } from "../workspaces";
import { webBaseUrl } from "../../../shared/runtime-config";

/** Workspace landing screen, intentionally limited to the existing web placeholder scope. */
export default function WorkspaceHomeScreen() {
  const { t } = useTranslation(["auth", "workspace", "common"]);
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const workspaces = useQuery(workspacesQueryOptions());
  const [foreground, muted] = useCSSVariable([
    "--color-foreground",
    "--color-muted-foreground",
  ]) as (string | undefined)[];
  const workspace = workspaces.data?.find((item) => item.slug === slug);

  if (workspaces.isPending) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <Spinner />
        <Text className="font-normal text-muted-foreground">{t("common:loading")}</Text>
      </View>
    );
  }

  if (!workspace) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState size="lg" className="px-6">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Building size={20} color={muted} strokeWidth={2} />
            </EmptyState.Media>
            <EmptyState.Title>
              {workspaces.isError
                ? t("auth:mobile.workspaceLoadFailed")
                : t("auth:mobile.workspaceUnavailable")}
            </EmptyState.Title>
          </EmptyState.Header>
          <EmptyState.Content>
            {workspaces.isError ? (
              <Button variant="outline" onPress={() => void workspaces.refetch()}>
                {t("common:retry")}
              </Button>
            ) : (
              <Button variant="outline" onPress={() => router.replace("/workspace-picker")}>
                {t("auth:mobile.workspaces")}
              </Button>
            )}
          </EmptyState.Content>
        </EmptyState>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-5 pb-10 pt-6">
      <View className="gap-1">
        <Text className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {t("auth:mobile.currentWorkspace")}
        </Text>
        <Text className="text-3xl font-bold text-foreground">{workspace.name}</Text>
        <Text className="font-normal text-sm text-muted-foreground">{workspace.slug}</Text>
      </View>

      <Frame>
        <Frame.Header>
          <Frame.Title>{t("workspace:heading")}</Frame.Title>
          <Frame.Description>{t("workspace:placeholder")}</Frame.Description>
        </Frame.Header>
        <Frame.Panel>
          <Frame.Row
            chevron
            onPress={() => router.push("/workspace-picker")}
            accessibilityLabel={t("auth:mobile.switchWorkspace")}
          >
            <Frame.Media>
              <Building size={18} color={foreground} strokeWidth={2} />
            </Frame.Media>
            <Frame.Content>
              <Frame.Title>{t("auth:mobile.switchWorkspace")}</Frame.Title>
              <Frame.Description>{workspace.slug}</Frame.Description>
            </Frame.Content>
          </Frame.Row>
          <Frame.Row
            chevron
            onPress={() => void Linking.openURL(webBaseUrl)}
            accessibilityLabel={t("auth:mobile.openWeb")}
          >
            <Frame.Media>
              <ExternalLink size={18} color={foreground} strokeWidth={2} />
            </Frame.Media>
            <Frame.Content>
              <Frame.Title>{t("auth:mobile.openWeb")}</Frame.Title>
              <Frame.Description>{webBaseUrl}</Frame.Description>
            </Frame.Content>
          </Frame.Row>
        </Frame.Panel>
      </Frame>
    </ScrollView>
  );
}
