/** Mirrors `apps/api/src/user/onboarding.ts`, which validates the stored value. */
export const ONBOARDING_STEPS = ["profile", "workspace", "completed"] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** The profile step's route, which is also the first step for a new account. */
export const PROFILE_STEP_ROUTE = "/onboarding/profile" as const;

/** The workspace step's route. */
export const WORKSPACE_STEP_ROUTE = "/onboarding/workspace" as const;

export type OnboardingRoute =
  | typeof PROFILE_STEP_ROUTE
  | typeof WORKSPACE_STEP_ROUTE
  | "/onboarding";

/** A route-local navigation action that is guarded by persisted onboarding state. */
export type OnboardingActionConfig = {
  readonly target: OnboardingRoute;
  readonly allowedSteps: readonly OnboardingStep[];
};

/**
 * The navigation controls a specific onboarding route chooses to expose.
 *
 * Both actions are opt-in per route, so the frame never invents a Back or a
 * Skip the step did not ask for:
 *
 * - `back` belongs to a step that can legitimately be revisited.
 * - `skip` belongs to a step setup does not depend on. A future "where did you
 *   hear from us" step would declare, alongside its own route,
 *   `skip: { target: WORKSPACE_STEP_ROUTE, allowedSteps: ["referral"] }`, while
 *   the steps that collect setup-critical state (name, first workspace)
 *   declare neither.
 *
 * `allowedSteps` keeps an action hidden for an account that has already moved
 * past the step: the workspace route stays reachable after setup for the
 * account menu's "create or join" action, and going back into the name step
 * from there would fight the guard on that route.
 */
export type OnboardingNavigationConfig = {
  readonly back?: OnboardingActionConfig;
  readonly skip?: OnboardingActionConfig;
};

/**
 * Narrows a session value to a known step.
 *
 * The API validates on write, but the session is a snapshot: a value this build
 * does not recognize (an older client, a hand-edited row) is treated as the
 * first step rather than leaving the router with nowhere to send the user.
 */
export function toOnboardingStep(value: unknown): OnboardingStep {
  return typeof value === "string" && (ONBOARDING_STEPS as readonly string[]).includes(value)
    ? (value as OnboardingStep)
    : "profile";
}

/**
 * Where a signed-in user belongs, or `null` when they belong in the app.
 *
 * The workspace step is decided by whether a workspace exists rather than by the
 * stored step, so it also covers a user whose only workspace was deleted after
 * setup finished, and a user who was invited to one before finishing setup.
 */
export function resolveOnboardingRedirect(input: {
  step: OnboardingStep;
  hasWorkspace: boolean;
}): typeof PROFILE_STEP_ROUTE | typeof WORKSPACE_STEP_ROUTE | null {
  if (input.step === "profile") return PROFILE_STEP_ROUTE;
  if (!input.hasWorkspace) return WORKSPACE_STEP_ROUTE;
  return null;
}

/** Returns the redirect for a direct step visit, preserving stored progress. */
export function resolveOnboardingRouteGuard(input: {
  requested: OnboardingRoute;
  stored: OnboardingStep;
}): OnboardingRoute | null {
  if (input.requested === PROFILE_STEP_ROUTE && input.stored === "completed") {
    return "/onboarding" as const;
  }

  if (input.requested === WORKSPACE_STEP_ROUTE && input.stored === "profile") {
    return PROFILE_STEP_ROUTE;
  }

  return null;
}

/** Whether a route-local action is valid for the session's persisted step. */
export function isOnboardingActionAvailable(
  action: OnboardingActionConfig | undefined,
  stored: OnboardingStep,
): boolean {
  return action?.allowedSteps.includes(stored) ?? false;
}
