import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Alert, Button, Frame, Spinner } from "panelui-native";
import { Building, ExternalLink } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useCSSVariable } from "uniwind";
import { SECTION_TAB_ITEMS } from "../../../components/navigation/tab-items";
import { authClient } from "../../auth/auth-client";
import { sessionQueryOptions } from "../../auth/session";
import { workspacesQueryOptions } from "../../workspaces/workspaces";
import { webBaseUrl } from "../../../shared/runtime-config";

/** Displays the current workspace and provides stable authenticated navigation actions. */
export default function HomeTabScreen() {
  const { t } = useTranslation(["auth", "workspace", "common", "settings"]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useQuery(sessionQueryOptions());
  const workspaces = useQuery(workspacesQueryOptions());
  const [foreground, muted] = useCSSVariable([
    "--color-foreground",
    "--color-muted-foreground",
  ]) as (string | undefined)[];
  const iconColor = foreground ?? "currentColor";
  const mutedColor = muted ?? "currentColor";
  const activeId = session.data?.session.activeOrganizationId;
  const workspace = workspaces.data?.find((item) => item.id === activeId) ?? workspaces.data?.[0];

  useEffect(() => {
    if (!workspace || workspace.id === activeId) return;
    void (async () => {
      try {
        const result = await authClient.organization.setActive({ organizationId: workspace.id });
        if (result.error) throw new Error(result.error.message);
        await queryClient.refetchQueries(
          { queryKey: sessionQueryOptions().queryKey },
          { throwOnError: true },
        );
      } catch {
        router.replace("/workspace-picker");
      }
    })();
  }, [activeId, queryClient, router, workspace]);

  if (session.isError || workspaces.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <Alert variant="destructive">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("auth:mobile.connectionTitle")}</Alert.Title>
            <Alert.Description>{t("auth:mobile.workspaceLoadFailed")}</Alert.Description>
          </Alert.Content>
        </Alert>
        <Button variant="outline" onPress={() => void workspaces.refetch()}>
          {t("common:retry")}
        </Button>
      </View>
    );
  }

  if (session.isPending || workspaces.isPending || !workspace) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <Spinner />
        <Text className="font-normal text-muted-foreground">{t("common:loading")}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-5 pb-40 pt-6">
      <View className="gap-1">
        <Text className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {t("auth:mobile.currentWorkspace")}
        </Text>
        <Text className="text-3xl font-bold text-foreground">{workspace.name}</Text>
        {session.data?.user.email ? (
          <Text className="font-normal text-sm text-muted-foreground">
            {session.data.user.email}
          </Text>
        ) : null}
      </View>

      <Frame>
        <Frame.Header>
          <Frame.Title>{t("auth:mobile.workspaceHome")}</Frame.Title>
          <Frame.Description>{t("workspace:placeholder")}</Frame.Description>
        </Frame.Header>
        <Frame.Panel>
          {SECTION_TAB_ITEMS.map((item) => (
            <Frame.Row
              key={item.name}
              chevron
              onPress={() => router.push(item.href)}
              accessibilityLabel={t(item.labelKey)}
            >
              <Frame.Media>
                <item.Icon size={18} color={mutedColor} strokeWidth={2} />
              </Frame.Media>
              <Frame.Content>
                <Frame.Title>{t(item.labelKey)}</Frame.Title>
                <Frame.Description>{t(item.descriptionKey)}</Frame.Description>
              </Frame.Content>
            </Frame.Row>
          ))}
        </Frame.Panel>
      </Frame>

      <Frame>
        <Frame.Header>
          <Frame.Title>{t("auth:mobile.workspaces")}</Frame.Title>
        </Frame.Header>
        <Frame.Panel>
          <Frame.Row
            chevron
            onPress={() => router.push("/workspace-picker")}
            accessibilityLabel={t("auth:mobile.switchWorkspace")}
          >
            <Frame.Media>
              <Building size={18} color={iconColor} strokeWidth={2} />
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
              <ExternalLink size={18} color={iconColor} strokeWidth={2} />
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
