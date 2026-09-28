import { createFileRoute, redirect } from "@tanstack/react-router";
import { OrganizationLayout } from "@/features/layout/organization-layout";
import { fetchWorkspacesForRoute } from "@/features/workspaces/hooks/use-workspaces";
import { authClient } from "@/shared/auth/auth-client";
import { PROFILE_STEP_ROUTE, toOnboardingStep } from "@/features/onboarding/onboarding";

export const Route = createFileRoute("/_authenticated/$orgSlug")({
  beforeLoad: async ({ context, params }) => {
    // A link straight into a workspace must not skip first-run setup. Only the
    // profile step is gated: the workspace step is satisfied by the workspace
    // in the URL, which is what invited users have.
    if (toOnboardingStep(context.session?.user?.onboardingStep) === "profile") {
      throw redirect({ to: PROFILE_STEP_ROUTE });
    }

    const organizations = await fetchWorkspacesForRoute(context.queryClient);
    const target = organizations.find((organization) => organization.slug === params.orgSlug);

    // The resolver sends members here; a direct link or stale bookmark to a
    // removed workspace loops back to it so it can pick a live one.
    if (!target) {
      throw redirect({ to: "/" });
    }

    // Endpoints that scope by the session's active organization need it to
    // match the URL on direct links and full reloads, not just in-app switches.
    const activeOrganizationId = context.session?.session?.activeOrganizationId;
    if (target.id !== activeOrganizationId) {
      await authClient.organization.setActive({ organizationId: target.id });
    }
  },
  component: OrganizationRoute,
});

function OrganizationRoute() {
  return <OrganizationLayout />;
}
