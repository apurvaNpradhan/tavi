import { authClient } from "../auth/auth-client";

/** Cache identity for the signed-in user's workspace membership list. */
export const workspacesQueryKey = ["workspaces"] as const;

/** One Better Auth organization, presented as a Tavi workspace. */
export type MobileWorkspace = NonNullable<
  Awaited<ReturnType<typeof authClient.organization.list>>["data"]
>[number];

/** Loads current workspace memberships and preserves API failures for retry. */
export function workspacesQueryOptions() {
  return {
    queryKey: workspacesQueryKey,
    staleTime: 30_000,
    queryFn: async (): Promise<MobileWorkspace[]> => {
      const result = await authClient.organization.list();
      if (result.error) throw new Error(result.error.message || "Could not load workspaces");
      return result.data ?? [];
    },
  };
}
