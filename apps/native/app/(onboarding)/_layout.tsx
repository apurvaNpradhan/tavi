import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../../shared/api-client";
import { resolveMobileAccess } from "../../features/auth/mobile-access";
import { sessionQueryOptions } from "../../features/auth/session";
import { workspacesQueryOptions } from "../../features/workspaces/workspaces";

/** Protects each onboarding screen with the current profile/workspace/invitation state. */
export default function OnboardingLayout() {
  const session = useQuery(sessionQueryOptions());
  const workspaces = useQuery({ ...workspacesQueryOptions(), enabled: Boolean(session.data) });
  const config = useQuery({
    ...orpc.config.get.queryOptions(),
    enabled: Boolean(session.data) && workspaces.data?.length === 0,
  });
  const access = resolveMobileAccess({ session, workspaces, config });

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={access.kind === "onboarding" && access.step === "profile"}>
        <Stack.Screen name="profile" />
      </Stack.Protected>
      <Stack.Protected guard={access.kind === "onboarding" && access.step === "workspace"}>
        <Stack.Screen name="workspace" />
      </Stack.Protected>
      <Stack.Protected guard={access.kind === "onboarding" && access.step === "invitation"}>
        <Stack.Screen name="invitation-needed" />
      </Stack.Protected>
    </Stack>
  );
}
