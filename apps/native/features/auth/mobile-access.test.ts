import { describe, expect, it } from "vitest";
import { resolveMobileAccess } from "./mobile-access";

const session = { user: { onboardingStep: "completed", role: "user" } };
const base = {
  session: { data: session, isPending: false, isError: false },
  workspaces: { data: [{ id: "workspace-1" }], isPending: false, isError: false },
  config: { data: { workspaceCreationEnabled: true }, isPending: false, isError: false },
};

describe("resolveMobileAccess", () => {
  it("keeps signed-out access separate from pending session state", () => {
    expect(
      resolveMobileAccess({
        ...base,
        session: { data: null, isPending: false, isError: false },
      }),
    ).toEqual({ kind: "signedOut" });
    expect(
      resolveMobileAccess({
        ...base,
        session: { data: undefined, isPending: true, isError: false },
      }),
    ).toEqual({ kind: "pending" });
  });

  it.each([
    ["profile", { onboardingStep: "profile" }],
    ["workspace", { onboardingStep: "workspace" }],
  ] as const)("resolves %s onboarding", (step, user) => {
    expect(
      resolveMobileAccess({
        ...base,
        session: { ...base.session, data: { user: { ...session.user, ...user } } },
        workspaces: { ...base.workspaces, data: [] },
      }),
    ).toEqual({ kind: "onboarding", step });
  });

  it("treats unknown onboarding states as profile, not authenticated access", () => {
    expect(
      resolveMobileAccess({
        ...base,
        session: {
          ...base.session,
          data: { user: { ...session.user, onboardingStep: "unknown" } },
        },
      }),
    ).toEqual({ kind: "onboarding", step: "profile" });
  });

  it("resolves invitation when workspace creation is unavailable", () => {
    expect(
      resolveMobileAccess({
        ...base,
        session: { data: session, isPending: false, isError: false },
        workspaces: { data: [], isPending: false, isError: false },
        config: { data: { workspaceCreationEnabled: false }, isPending: false, isError: false },
      }),
    ).toEqual({ kind: "onboarding", step: "invitation" });
  });

  it("allows an administrator to create a workspace when public creation is disabled", () => {
    expect(
      resolveMobileAccess({
        ...base,
        session: {
          ...base.session,
          data: { user: { ...session.user, onboardingStep: "workspace", role: "admin" } },
        },
        workspaces: { ...base.workspaces, data: [] },
        config: { data: { workspaceCreationEnabled: false }, isPending: false, isError: false },
      }),
    ).toEqual({ kind: "onboarding", step: "workspace" });
  });

  it("does not block an existing workspace on public config loading or failure", () => {
    expect(
      resolveMobileAccess({
        ...base,
        config: { data: undefined, isPending: true, isError: false },
      }),
    ).toEqual({ kind: "ready" });
    expect(
      resolveMobileAccess({
        ...base,
        config: { data: undefined, isPending: false, isError: true },
      }),
    ).toEqual({ kind: "ready" });
  });

  it("resolves ready and preserves error as its own state", () => {
    expect(resolveMobileAccess(base)).toEqual({ kind: "ready" });
    expect(
      resolveMobileAccess({
        ...base,
        session: { data: undefined, isPending: false, isError: true },
      }),
    ).toEqual({ kind: "error" });
  });
});
