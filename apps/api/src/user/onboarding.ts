/**
 * First-run setup progress, stored on `user.onboarding_step`.
 *
 * The column is a plain `text` because Better Auth's `additionalFields` only
 * types `string`/`number`/`boolean`/`date`/`json` — there is no enum — so this
 * module is the validation boundary. Every write goes through
 * `isOnboardingStep`, and the mirrored constant in the web app
 * (`apps/web/src/features/onboarding/onboarding.ts`) must match this list.
 *
 * The steps are ordered. `profile` is required of everyone; `workspace` is only
 * reachable from `profile`; `completed` is terminal.
 */
export const ONBOARDING_STEPS = ["profile", "workspace", "completed"] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** The step a user starts on. Mirrors the column default. */
export const FIRST_ONBOARDING_STEP: OnboardingStep = "profile";

/** The step that means setup is done. */
export const COMPLETED_ONBOARDING_STEP: OnboardingStep = "completed";

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return typeof value === "string" && (ONBOARDING_STEPS as readonly string[]).includes(value);
}

/**
 * Narrows a stored value, falling back to the first step.
 *
 * Rows written before the column existed cannot contain an unknown value, but a
 * hand-edited database can, and an unrecognized step would otherwise leave the
 * router with no destination. Treating it as `profile` at worst repeats setup.
 */
export function toOnboardingStep(value: unknown): OnboardingStep {
  return isOnboardingStep(value) ? value : FIRST_ONBOARDING_STEP;
}
