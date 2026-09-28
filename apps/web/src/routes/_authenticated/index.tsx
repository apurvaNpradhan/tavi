import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchWorkspacesForRoute } from "@/features/workspaces/hooks/use-workspaces";
import { authClient } from "@/shared/auth/auth-client";
import { resolveOnboardingRedirect, toOnboardingStep } from "@/features/onboarding/onboarding";

/**
 * Chooses where a signed-in user lands.
 *
 * First-run setup wins over workspace selection, so an account that has not
 * finished the profile step is sent there even if it already belongs to a
 * workspace. Otherwise the workspace step is decided by whether a workspace
 * exists, and a user who needs neither goes to the workspace their session is
 * active on — falling back to the first entry when that id is stale (for
 * example after a workspace was deleted). The workspace list comes from the
 * shared cache, so the sidebar that renders next does not refetch it.
 */
export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: async ({ context }) => {
    const organizations = await fetchWorkspacesForRoute(context.queryClient);
    const step = toOnboardingStep(context.session?.user?.onboardingStep);

    const onboardingRedirect = resolveOnboardingRedirect({
      step,
      hasWorkspace: organizations.length > 0,
    });

    if (onboardingRedirect) {
      throw redirect({ to: onboardingRedirect });
    }

    const activeOrganizationId = context.session?.session?.activeOrganizationId;
    const target =
      organizations.find((organization) => organization.id === activeOrganizationId) ??
      organizations[0];

    // A stale active id is corrected here so later reads of the session agree
    // with the organization the user was just sent to.
    if (target.id !== activeOrganizationId) {
      await authClient.organization.setActive({ organizationId: target.id });
    }

    throw redirect({
      to: "/$orgSlug",
      params: { orgSlug: target.slug },
    });
  },
});
