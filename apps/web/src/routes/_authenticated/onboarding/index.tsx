import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchWorkspacesForRoute } from "@/features/workspaces/hooks/use-workspaces";
import {
  resolveOnboardingRedirect,
  toOnboardingStep,
  WORKSPACE_STEP_ROUTE,
} from "@/features/onboarding/onboarding";

/**
 * Entry point for `/onboarding`.
 *
 * Sends a user to whichever step is actually theirs. The account menu's
 * "create or join" link lands here for an account that has already finished
 * setup, and that account belongs on the workspace step — not back at the
 * profile step, and not bounced into the app it was trying to leave.
 */
export const Route = createFileRoute("/_authenticated/onboarding/")({
  beforeLoad: async ({ context }) => {
    const step = toOnboardingStep(context.session?.user?.onboardingStep);
    const organizations = await fetchWorkspacesForRoute(context.queryClient);

    throw redirect({
      to:
        resolveOnboardingRedirect({ step, hasWorkspace: organizations.length > 0 }) ??
        WORKSPACE_STEP_ROUTE,
    });
  },
});
