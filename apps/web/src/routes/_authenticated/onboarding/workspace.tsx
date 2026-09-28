import { createFileRoute, redirect } from "@tanstack/react-router";
import { WorkspaceStep } from "@/features/onboarding/workspace-step";
import {
  PROFILE_STEP_ROUTE,
  resolveOnboardingRouteGuard,
  toOnboardingStep,
  type OnboardingNavigationConfig,
} from "@/features/onboarding/onboarding";

const navigation = {
  back: {
    target: PROFILE_STEP_ROUTE,
    allowedSteps: ["workspace"],
  },
} satisfies OnboardingNavigationConfig;

/**
 * The workspace-creation step.
 *
 * Gated only against *skipping ahead*: an account that has finished setup can
 * still come here to create another workspace, which is what the account menu's
 * "create or join" action does.
 */
export const Route = createFileRoute("/_authenticated/onboarding/workspace")({
  beforeLoad: async ({ context }) => {
    const step = toOnboardingStep(context.session?.user?.onboardingStep);

    const guardTarget = resolveOnboardingRouteGuard({
      requested: "/onboarding/workspace",
      stored: step,
    });

    if (guardTarget) {
      throw redirect({ to: guardTarget });
    }
  },
  component: () => <WorkspaceStep navigation={navigation} />,
});
