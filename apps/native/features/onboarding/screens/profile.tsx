import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Input } from "panelui-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { OnboardingFrame } from "../onboarding-frame";
import { authClient } from "../../auth/auth-client";
import { sessionQueryOptions } from "../../auth/session";
import { signOut } from "../../auth/sign-out";
import { workspacesQueryOptions } from "../../workspaces/workspaces";

/** Collects the account name before workspace setup, matching web onboarding. */
export default function ProfileOnboardingScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const queryClient = useQueryClient();
  const session = useQuery(sessionQueryOptions());
  const workspaces = useQuery(workspacesQueryOptions());
  const [name, setName] = useState(session.data?.user.name ?? "");
  const [pending, setPending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveProfile() {
    if (name.trim().length < 2) {
      setError(t("auth:mobile.nameRequired"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      // Invited users already have a workspace, so they can finish setup here.
      const step = workspaces.data?.length ? "completed" : "workspace";
      const result = await authClient.updateUser({ name: name.trim(), onboardingStep: step });
      if (result.error) throw new Error(result.error.message);
      await queryClient.refetchQueries({ queryKey: sessionQueryOptions().queryKey });
    } catch {
      setError(t("auth:onboarding.profileFailed"));
    } finally {
      setPending(false);
    }
  }

  /**
   * The escape hatch behind the top-right control.
   *
   * The name step cannot be skipped, so leaving setup means signing out and
   * landing back on the welcome screen — the account resumes here on the next
   * sign-in.
   */
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

  return (
    <OnboardingFrame
      current="profile"
      title={t("auth:onboarding.profileTitle")}
      onSkip={() => void leaveOnboarding()}
      skipLabel={t("auth:mobile.signOut")}
      busy={pending || leaving}
      primaryLabel={t("auth:onboarding.profileContinue")}
      onPrimaryPress={() => void saveProfile()}
      primaryLoading={pending}
      primaryDisabled={pending || leaving || workspaces.isPending || workspaces.isError}
    >
      <View className="gap-4">
        <Input
          value={name}
          onChangeText={setName}
          placeholder={t("auth:onboarding.namePlaceholder")}
          size="lg"
          autoComplete="name"
          textContentType="name"
          editable={!pending && !leaving}
        />
        {workspaces.isError ? (
          <View className="gap-2">
            <Text className="font-normal text-center text-destructive" accessibilityRole="alert">
              {t("auth:mobile.workspaceLoadFailed")}
            </Text>
            <Button variant="outline" onPress={() => void workspaces.refetch()}>
              {t("common:retry")}
            </Button>
          </View>
        ) : null}
        {error ? (
          <Text className="font-normal text-center text-destructive" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>
    </OnboardingFrame>
  );
}
