import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProfileStep } from "@/features/onboarding/profile-step";
import {
  PROFILE_STEP_ROUTE,
  resolveOnboardingRouteGuard,
  toOnboardingStep,
  type OnboardingNavigationConfig,
} from "@/features/onboarding/onboarding";

const navigation = {} satisfies OnboardingNavigationConfig;

/**
 * The name-and-photo step.
 *
 * Reachable only while it is actually outstanding. An account that has already
 * passed it is sent back to `/onboarding`, which re-resolves the destination —
 * repeating that decision here is how the two would drift.
 */
export const Route = createFileRoute("/_authenticated/onboarding/profile")({
  beforeLoad: async ({ context }) => {
    const step = toOnboardingStep(context.session?.user?.onboardingStep);

    const guardTarget = resolveOnboardingRouteGuard({
      requested: PROFILE_STEP_ROUTE,
      stored: step,
    });

    if (guardTarget) {
      throw redirect({ to: guardTarget });
    }
  },
  component: () => <ProfileStep navigation={navigation} />,
});
