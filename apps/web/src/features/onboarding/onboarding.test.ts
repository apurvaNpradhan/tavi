import { describe, expect, it } from "vitest";
import {
  isOnboardingActionAvailable,
  PROFILE_STEP_ROUTE,
  resolveOnboardingRedirect,
  resolveOnboardingRouteGuard,
  toOnboardingStep,
  WORKSPACE_STEP_ROUTE,
} from "./onboarding";

describe("toOnboardingStep", () => {
  it("keeps a known step", () => {
    expect(toOnboardingStep("workspace")).toBe("workspace");
    expect(toOnboardingStep("completed")).toBe("completed");
  });

  it("falls back to the first step for an unknown or missing value", () => {
    expect(toOnboardingStep(undefined)).toBe("profile");
    expect(toOnboardingStep(null)).toBe("profile");
    expect(toOnboardingStep("later")).toBe("profile");
    expect(toOnboardingStep(7)).toBe("profile");
  });
});

describe("resolveOnboardingRedirect", () => {
  it("sends a new account to the profile step even when it has a workspace", () => {
    expect(resolveOnboardingRedirect({ step: "profile", hasWorkspace: true })).toBe(
      PROFILE_STEP_ROUTE,
    );
  });

  it("sends a profile-complete account with no workspace to the workspace step", () => {
    expect(resolveOnboardingRedirect({ step: "workspace", hasWorkspace: false })).toBe(
      WORKSPACE_STEP_ROUTE,
    );
  });

  it("keeps a finished account in the app", () => {
    expect(resolveOnboardingRedirect({ step: "completed", hasWorkspace: true })).toBeNull();
  });

  it("sends a finished account whose only workspace was deleted back to the workspace step", () => {
    // The step alone cannot express this: setup is done, but there is nowhere
    // for the account to land.
    expect(resolveOnboardingRedirect({ step: "completed", hasWorkspace: false })).toBe(
      WORKSPACE_STEP_ROUTE,
    );
  });
});

describe("resolveOnboardingRouteGuard", () => {
  it("allows the current workspace route for an in-progress account", () => {
    expect(
      resolveOnboardingRouteGuard({ requested: WORKSPACE_STEP_ROUTE, stored: "workspace" }),
    ).toBeNull();
  });

  it("allows returning to profile before setup is complete", () => {
    expect(
      resolveOnboardingRouteGuard({ requested: PROFILE_STEP_ROUTE, stored: "workspace" }),
    ).toBe(null);
  });

  it("keeps a completed account from entering profile", () => {
    expect(
      resolveOnboardingRouteGuard({ requested: PROFILE_STEP_ROUTE, stored: "completed" }),
    ).toBe("/onboarding");
  });

  it("does not change persisted completion when workspace is revisited", () => {
    expect(
      resolveOnboardingRouteGuard({ requested: WORKSPACE_STEP_ROUTE, stored: "completed" }),
    ).toBeNull();
  });
});

describe("isOnboardingActionAvailable", () => {
  const back = { target: PROFILE_STEP_ROUTE, allowedSteps: ["workspace"] as const };

  it("only enables an action for its configured stored steps", () => {
    expect(isOnboardingActionAvailable(back, "workspace")).toBe(true);
    expect(isOnboardingActionAvailable(back, "completed")).toBe(false);
    expect(isOnboardingActionAvailable(undefined, "workspace")).toBe(false);
  });
});
