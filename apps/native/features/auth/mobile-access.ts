/** The route-access states used by the native protected navigation tree. */
export type MobileAccessState =
  | { readonly kind: "pending" }
  | { readonly kind: "error" }
  | { readonly kind: "signedOut" }
  | { readonly kind: "onboarding"; readonly step: "profile" | "workspace" | "invitation" }
  | { readonly kind: "ready" };

type MobileAccessSession = {
  readonly user: {
    readonly onboardingStep: string;
    readonly role?: string | null;
  };
};

type MobileAccessQueries = {
  readonly session: {
    readonly data: MobileAccessSession | null | undefined;
    readonly isPending: boolean;
    readonly isError: boolean;
  };
  readonly workspaces: {
    readonly data: ReadonlyArray<{ readonly id: string }> | undefined;
    readonly isPending: boolean;
    readonly isError: boolean;
  };
  readonly config: {
    readonly data: { readonly workspaceCreationEnabled: boolean } | undefined;
    readonly isPending: boolean;
    readonly isError: boolean;
  };
};

/** Resolves native route access without treating loading or connection errors as signed-out. */
export function resolveMobileAccess({
  session,
  workspaces,
  config,
}: MobileAccessQueries): MobileAccessState {
  if (session.isPending) return { kind: "pending" };
  if (session.isError) return { kind: "error" };
  if (!session.data) return { kind: "signedOut" };

  if (
    session.data.user.onboardingStep !== "completed" &&
    session.data.user.onboardingStep !== "workspace"
  ) {
    return { kind: "onboarding", step: "profile" };
  }

  if (workspaces.isPending) return { kind: "pending" };
  if (workspaces.isError) return { kind: "error" };
  if (!workspaces.data) return { kind: "pending" };
  if (workspaces.data.length > 0) return { kind: "ready" };

  if (config.isPending) return { kind: "pending" };
  if (config.isError) return { kind: "error" };
  if (!config.data) return { kind: "pending" };

  const canCreateWorkspace =
    config.data.workspaceCreationEnabled || session.data.user.role === "admin";
  return { kind: "onboarding", step: canCreateWorkspace ? "workspace" : "invitation" };
}
