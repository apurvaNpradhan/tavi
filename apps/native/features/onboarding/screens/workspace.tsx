import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button, Input } from "panelui-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { OnboardingFrame } from "../onboarding-frame";
import { orpc } from "../../../shared/api-client";
import { authClient } from "../../auth/auth-client";
import { createMobileWorkspace } from "../../workspaces/create-workspace";
import { sessionQueryOptions } from "../../auth/session";
import { signOut } from "../../auth/sign-out";
import { workspacesQueryKey } from "../../workspaces/workspaces";

/** Creates the first workspace for a new Tavi account. */
export default function WorkspaceOnboardingScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const queryClient = useQueryClient();
  const config = useQuery(orpc.config.get.queryOptions());
  const session = useQuery(sessionQueryOptions());
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreateWorkspace =
    config.data?.workspaceCreationEnabled || session.data?.user.role === "admin";

  async function createWorkspace() {
    if (!name.trim()) {
      setError(t("auth:onboarding.validation.workspaceNameRequired"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      await createMobileWorkspace(name.trim());
      await queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      await queryClient.refetchQueries({ queryKey: workspacesQueryKey });
      await queryClient.refetchQueries({ queryKey: sessionQueryOptions().queryKey });
    } catch {
      setError(t("auth:mobile.workspaceCreateFailed"));
    } finally {
      setPending(false);
    }
  }

  /**
   * Returns to the name step.
   *
   * Native access is derived from the persisted step rather than the router, so
   * going back means putting the stored step back to `profile` and letting the
   * protected navigation show that screen again.
   */
  async function backToProfile() {
    setPending(true);
    setError(null);
    try {
      const result = await authClient.updateUser({ onboardingStep: "profile" });
      if (result.error) throw new Error(result.error.message);
      await queryClient.refetchQueries({ queryKey: sessionQueryOptions().queryKey });
    } catch {
      setError(t("auth:onboarding.profileFailed"));
      setPending(false);
    }
  }

  /** Leaves setup behind the top-right control, preserving stored progress. */
  async function leaveOnboarding() {
    setLeaving(true);
    setError(null);
    try {
      await signOut();
    } catch {
      setError(t("auth:mobile.signOutFailed"));
      setLeaving(false);
    }
  }

  if (config.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Text className="font-normal text-destructive">{t("auth:mobile.workspaceLoadFailed")}</Text>
        <Button variant="outline" onPress={() => void config.refetch()}>
          {t("common:retry")}
        </Button>
      </View>
    );
  }
  if (config.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator accessibilityLabel={t("common:loading")} />
      </View>
    );
  }
  if (config.data && !canCreateWorkspace) return null;

  return (
    <OnboardingFrame
      current="workspace"
      title={t("auth:onboarding.title")}
      onBack={() => void backToProfile()}
      onSkip={() => void leaveOnboarding()}
      skipLabel={t("auth:mobile.signOut")}
      busy={pending || leaving}
      primaryLabel={t("auth:onboarding.createWorkspace")}
      onPrimaryPress={() => void createWorkspace()}
      primaryLoading={pending}
      primaryDisabled={pending || leaving || !name.trim()}
    >
      <View className="gap-4">
        <Input
          value={name}
          onChangeText={setName}
          placeholder={t("auth:onboarding.workspaceNamePlaceholder")}
          size="lg"
          autoCapitalize="words"
          editable={!pending && !leaving}
        />
        {error ? (
          <Text className="font-normal text-center text-destructive" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>
    </OnboardingFrame>
  );
}
