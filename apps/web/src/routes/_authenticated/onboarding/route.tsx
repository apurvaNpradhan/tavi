import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout for the first-run steps.
 *
 * Exists only to host the child routes: each step owns its own title and
 * progress indicator through `OnboardingFrame`, so there is nothing to render
 * here beyond the outlet.
 */
export const Route = createFileRoute("/_authenticated/onboarding")({
  component: () => <Outlet />,
});
