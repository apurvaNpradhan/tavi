import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Alert, Avatar, Button, Frame, Input, ThemeSelector } from "panelui-native";
import { Building, ExternalLink, LogOut, Trash2, UserRound } from "lucide-react-native";
import { useCSSVariable } from "uniwind";
import { authClient } from "../../auth/auth-client";
import { sessionQueryOptions } from "../../auth/session";
import { signOut } from "../../auth/sign-out";
import { workspacesQueryOptions } from "../../workspaces/workspaces";
import { webBaseUrl } from "../../../shared/runtime-config";

/**
 * Account settings reachable from More: real Better Auth mutations for the
 * profile and sign-out, plus an honest web handoff for account deletion, which
 * the API only performs from an emailed link opened in the browser.
 */
export default function SettingsScreen() {
  const { t } = useTranslation(["settings", "auth", "common"]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useQuery(sessionQueryOptions());
  const workspaces = useQuery(workspacesQueryOptions());
  const [editedName, setEditedName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const foreground = useCSSVariable("--color-foreground") as string;
  const muted = useCSSVariable("--color-muted-foreground") as string;
  const user = session.data?.user;

  const name = editedName ?? user?.name ?? "";
  const activeWorkspaceId = session.data?.session.activeOrganizationId;
  const workspace =
    workspaces.data?.find((item) => item.id === activeWorkspaceId) ?? workspaces.data?.[0];
  const deleteAccountUrl = workspace?.slug
    ? `${webBaseUrl}/${encodeURIComponent(workspace.slug)}/settings/delete-account`
    : null;

  async function saveName() {
    const nextName = name.trim();
    if (nextName.length < 2) {
      setError(t("auth:mobile.nameRequired"));
      setMessage(null);
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await authClient.updateUser({ name: nextName });
      if (result.error) throw new Error(result.error.message);
      await queryClient.refetchQueries(
        { queryKey: sessionQueryOptions().queryKey },
        { throwOnError: true },
      );
      setMessage(t("settings:profile.saved"));
    } catch {
      setError(t("settings:profile.failed"));
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    setPending(true);
    setError(null);
    try {
      await signOut();
    } catch {
      setError(t("auth:mobile.signOutFailed"));
      setPending(false);
    }
  }

  async function openDeleteAccountOnWeb() {
    if (!deleteAccountUrl) return;
    setError(null);
    try {
      await Linking.openURL(deleteAccountUrl);
    } catch {
      setError(t("settings:deleteAccount.openFailed"));
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-5 pb-40 pt-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-1">
        <Text className="text-3xl font-bold text-foreground">{t("settings:title")}</Text>
        <Text className="font-normal text-muted-foreground">{t("settings:description")}</Text>
      </View>

      <Frame>
        <Frame.Header>
          <Frame.Title>{t("settings:profile.title")}</Frame.Title>
          <Frame.Description>{t("settings:profile.description")}</Frame.Description>
        </Frame.Header>
        <Frame.Panel>
          <Frame.Row align="start">
            <Frame.Media>
              <Avatar
                size="lg"
                source={user?.image ? { uri: user.image } : undefined}
                fallback={initials(user?.name)}
              />
            </Frame.Media>
            <Frame.Content>
              <Input
                label={t("settings:profile.name")}
                placeholder={t("settings:profile.namePlaceholder")}
                value={name}
                onChangeText={setEditedName}
                editable={!pending}
                autoComplete="name"
                textContentType="name"
              />
            </Frame.Content>
          </Frame.Row>
          <Frame.Row>
            <Frame.Media>
              <UserRound size={18} color={muted} />
            </Frame.Media>
            <Frame.Content>
              <Frame.Title>{t("settings:profile.email")}</Frame.Title>
              <Frame.Description>{user?.email ?? ""}</Frame.Description>
            </Frame.Content>
          </Frame.Row>
        </Frame.Panel>
        <Frame.Footer>
          <Button fullWidth loading={pending} disabled={pending} onPress={() => void saveName()}>
            {t("settings:profile.save")}
          </Button>
        </Frame.Footer>
      </Frame>

      {error ? (
        <Alert variant="destructive">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      {message ? (
        <Alert variant="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{message}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Frame>
        <Frame.Header>
          <Frame.Title>{t("settings:appearance.title")}</Frame.Title>
          <Frame.Description>{t("settings:mobile.appearanceDescription")}</Frame.Description>
        </Frame.Header>
        <Frame.Panel>
          <Frame.Row align="start">
            <Frame.Content>
              <Frame.Title>{t("settings:appearance.theme")}</Frame.Title>
              <Frame.Description>{t("settings:appearance.themeSystemHint")}</Frame.Description>
            </Frame.Content>
            <Frame.Actions>
              <ThemeSelector size="sm" />
            </Frame.Actions>
          </Frame.Row>
        </Frame.Panel>
      </Frame>

      <Frame>
        <Frame.Header>
          <Frame.Title>{t("auth:mobile.workspaces")}</Frame.Title>
        </Frame.Header>
        <Frame.Panel>
          <Frame.Row
            chevron
            onPress={() => router.push("/(authenticated)/workspace-picker")}
            accessibilityLabel={t("auth:mobile.switchWorkspace")}
          >
            <Frame.Media>
              <Building size={18} color={foreground} />
            </Frame.Media>
            <Frame.Content>
              <Frame.Title>{t("auth:mobile.switchWorkspace")}</Frame.Title>
              <Frame.Description>
                {workspace?.name ?? t("auth:mobile.currentWorkspace")}
              </Frame.Description>
            </Frame.Content>
          </Frame.Row>
          <Frame.Row
            chevron
            onPress={() => void Linking.openURL(webBaseUrl)}
            accessibilityLabel={t("auth:mobile.openWeb")}
          >
            <Frame.Media>
              <ExternalLink size={18} color={foreground} />
            </Frame.Media>
            <Frame.Content>
              <Frame.Title>{t("auth:mobile.openWeb")}</Frame.Title>
            </Frame.Content>
          </Frame.Row>
        </Frame.Panel>
      </Frame>

      <Frame>
        <Frame.Header>
          <Frame.Title>{t("settings:account.title")}</Frame.Title>
          <Frame.Description>{t("settings:account.description")}</Frame.Description>
        </Frame.Header>
        <Frame.Panel>
          <Frame.Row
            onPress={() => void handleSignOut()}
            disabled={pending}
            accessibilityLabel={t("auth:mobile.signOut")}
          >
            <Frame.Media>
              <LogOut size={18} color={foreground} />
            </Frame.Media>
            <Frame.Content>
              <Frame.Title>{t("auth:mobile.signOut")}</Frame.Title>
              <Frame.Description>{t("settings:account.signOutHint")}</Frame.Description>
            </Frame.Content>
          </Frame.Row>
        </Frame.Panel>
      </Frame>

      <Frame>
        <Frame.Header>
          <Frame.Title>{t("settings:deleteAccount.title")}</Frame.Title>
          <Frame.Description>{t("settings:deleteAccount.description")}</Frame.Description>
        </Frame.Header>
        <Frame.Panel>
          <Frame.Row align="start">
            <Frame.Content className="gap-1">
              <Text className="font-normal text-sm text-destructive">
                {t("settings:mobile.deleteAccountWarning")}
              </Text>
              <Text className="font-normal text-xs text-muted-foreground">
                {deleteAccountUrl
                  ? t("settings:deleteAccount.openHint", { workspace: workspace?.name ?? "" })
                  : t("auth:mobile.noWorkspace")}
              </Text>
            </Frame.Content>
          </Frame.Row>
        </Frame.Panel>
        <Frame.Footer>
          <Button
            variant="destructive"
            fullWidth
            disabled={!deleteAccountUrl}
            startContent={<Trash2 size={16} />}
            accessibilityLabel={t("settings:deleteAccount.openOnWeb")}
            accessibilityHint={t("settings:deleteAccount.openHint", {
              workspace: workspace?.name ?? "",
            })}
            onPress={() => void openDeleteAccountOnWeb()}
          >
            {t("settings:deleteAccount.openOnWeb")}
          </Button>
        </Frame.Footer>
      </Frame>

      {Constants.expoConfig?.version ? (
        <Text className="font-normal text-center text-xs text-muted-foreground">
          {t("settings:version", { version: Constants.expoConfig.version })}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function initials(name: string | undefined) {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
