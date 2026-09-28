import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppI18nProvider } from "@/shared/i18n/provider";
import { OnboardingFrame } from "./onboarding-frame";
import {
  type OnboardingNavigationConfig,
  PROFILE_STEP_ROUTE,
  WORKSPACE_STEP_ROUTE,
} from "./onboarding";

const { navigate } = vi.hoisted(() => ({
  navigate: vi.fn<(input: { to: string }) => Promise<void>>(),
}));

// The frame reads the stored step only to decide whether the controls its route
// declared are usable, so the session is stubbed rather than built.
// oxlint-disable-next-line anti-slop/no-module-mocking
vi.mock("@/shared/providers/auth-provider/hooks/use-auth", () => ({
  useAuth: () => ({ user: { onboardingStep: "workspace" } }),
}));

// oxlint-disable-next-line anti-slop/no-module-mocking
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => navigate,
}));

function renderFrame(navigation?: OnboardingNavigationConfig) {
  return render(
    <AppI18nProvider>
      <OnboardingFrame current="workspace" title="Create a workspace" navigation={navigation}>
        <p>Form goes here</p>
      </OnboardingFrame>
    </AppI18nProvider>,
  );
}

describe("onboarding frame", () => {
  it("renders a progress dot per step and marks the current one", async () => {
    renderFrame();

    const steps = await screen.findAllByRole("listitem");

    expect(steps).toHaveLength(2);
    expect(steps[0]).not.toHaveAttribute("aria-current");
    expect(steps[1]).toHaveAttribute("aria-current", "step");
  });

  it("renders no navigation it was not given", async () => {
    renderFrame();

    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
  });

  it("goes back to the route its step declared", async () => {
    renderFrame({ back: { target: PROFILE_STEP_ROUTE, allowedSteps: ["workspace"] } });

    fireEvent.click(await screen.findByRole("button", { name: "Back" }));

    expect(navigate).toHaveBeenCalledWith({ to: PROFILE_STEP_ROUTE });
  });

  it("skips forward to the route its step declared", async () => {
    renderFrame({ skip: { target: WORKSPACE_STEP_ROUTE, allowedSteps: ["workspace"] } });

    fireEvent.click(await screen.findByRole("button", { name: "Skip" }));

    expect(navigate).toHaveBeenCalledWith({ to: WORKSPACE_STEP_ROUTE });
  });

  it("hides an action the stored step no longer allows", async () => {
    renderFrame({ back: { target: PROFILE_STEP_ROUTE, allowedSteps: ["profile"] } });

    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });
});
