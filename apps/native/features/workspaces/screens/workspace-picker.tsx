import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Alert, Button, EmptyState, Frame, Skeleton, Spinner } from "panelui-native";
import { Building, Check, ChevronRight } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useCSSVariable } from "uniwind";
import { authClient } from "../../auth/auth-client";
import { sessionQueryOptions } from "../../auth/session";
import { workspacesQueryOptions } from "../workspaces";

/** Lets members select one of their authorized workspaces. */
export default function WorkspacePickerScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaces = useQuery(workspacesQueryOptions());
  const session = useQuery(sessionQueryOptions());
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [foreground, muted] = useCSSVariable([
    "--color-foreground",
    "--color-muted-foreground",
  ]) as (string | undefined)[];
  const activeId = session.data?.session.activeOrganizationId;

  async function selectWorkspace(workspaceId: string) {
    if (workspaceId === activeId) {
      if (router.canGoBack()) router.back();
      return;
    }
    setPendingId(workspaceId);
    setError(null);
    try {
      const result = await authClient.organization.setActive({ organizationId: workspaceId });
      if (result.error) throw new Error(result.error.message);
      await queryClient.refetchQueries(
        { queryKey: sessionQueryOptions().queryKey },
        { throwOnError: true },
      );
      if (router.canGoBack()) router.back();
      else router.replace("/(authenticated)/(tabs)");
    } catch {
      setError(t("auth:mobile.workspaceSwitchFailed"));
      setPendingId(null);
    }
  }

  if (workspaces.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-5">
        <Alert variant="destructive">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("auth:mobile.workspaceLoadFailed")}</Alert.Title>
          </Alert.Content>
        </Alert>
        <Button variant="outline" onPress={() => void workspaces.refetch()}>
          {t("common:retry")}
        </Button>
        {router.canGoBack() ? (
          <Button variant="ghost" onPress={() => router.back()}>
            {t("common:cancel")}
          </Button>
        ) : null}
      </View>
    );
  }

  const list = workspaces.data ?? [];
  const busy = pendingId !== null;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 px-5 pb-10 pt-6">
      <Text className="text-3xl font-bold text-foreground">{t("auth:mobile.workspaces")}</Text>

      {error ? (
        <Alert variant="destructive">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {workspaces.isPending ? (
        <Frame>
          <Frame.Panel>
            <SkeletonRow label={t("common:loading")} />
            <SkeletonRow />
          </Frame.Panel>
        </Frame>
      ) : null}

      {!workspaces.isPending && list.length === 0 ? (
        <EmptyState variant="card" size="sm">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Building size={20} color={muted} strokeWidth={2} />
            </EmptyState.Media>
            <EmptyState.Description>{t("auth:mobile.workspaceUnavailable")}</EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : null}

      {list.length > 0 ? (
        <Frame>
          <Frame.Panel>
            {list.map((workspace) => {
              const isActive = workspace.id === activeId;
              const isPending = pendingId === workspace.id;
              return (
                <Frame.Row
                  key={workspace.id}
                  onPress={() => void selectWorkspace(workspace.id)}
                  disabled={busy}
                  accessibilityLabel={workspace.name}
                  accessibilityState={{ selected: isActive }}
                >
                  <Frame.Media>
                    <Building size={18} color={isActive ? foreground : muted} strokeWidth={2} />
                  </Frame.Media>
                  <Frame.Content>
                    <Frame.Title>{workspace.name}</Frame.Title>
                    <Frame.Description>{workspace.slug}</Frame.Description>
                  </Frame.Content>
                  <Frame.Actions>
                    {isPending ? (
                      <Spinner size="sm" />
                    ) : isActive ? (
                      <Check size={18} color={foreground} strokeWidth={2.5} />
                    ) : (
                      <ChevronRight size={18} color={muted} strokeWidth={2} />
                    )}
                  </Frame.Actions>
                </Frame.Row>
              );
            })}
          </Frame.Panel>
        </Frame>
      ) : null}

      {router.canGoBack() ? (
        <Button variant="outline" onPress={() => router.back()}>
          {t("common:cancel")}
        </Button>
      ) : null}
    </ScrollView>
  );
}

/** Placeholder row shaped like the workspace row it stands in for. */
function SkeletonRow({ label }: { label?: string }) {
  return (
    <Frame.Row>
      <Frame.Media>
        <Skeleton className="h-9 w-9 rounded-full" />
      </Frame.Media>
      <Frame.Content className="gap-2">
        <Skeleton className="h-4 w-32" label={label} />
        <Skeleton className="h-3 w-20" />
      </Frame.Content>
    </Frame.Row>
  );
}
