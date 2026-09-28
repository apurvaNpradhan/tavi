import { type QueryClient, useQuery } from "@tanstack/react-query";
import { authClient } from "@/shared/auth/auth-client";

type WorkspaceListResult = Awaited<ReturnType<typeof authClient.organization.list>>;

/** One organization from Better Auth, which owns workspace membership. */
export type Workspace = NonNullable<WorkspaceListResult["data"]>[number];

/**
 * The key every workspace consumer reads and every workspace mutation
 * invalidates. Kept next to the query so the two cannot drift.
 */
export const workspacesQueryKey = ["workspaces"] as const;

/**
 * The caller's workspaces.
 *
 * Shared by the sidebar and the route resolvers, so the resolver that picks a
 * workspace and the sidebar that lists them cost one request between them.
 */
export function workspacesQueryOptions() {
  return {
    queryKey: workspacesQueryKey,
    staleTime: 30_000,
    queryFn: async (): Promise<Workspace[]> => {
      const result = await authClient.organization.list();
      return result.data ?? [];
    },
  };
}

/**
 * Loads the authoritative workspace list for route guards.
 *
 * Guards must not rely on cached memberships: after creating or being invited
 * to a workspace, that cache can be stale even when it already has data.
 */
export function fetchWorkspacesForRoute(
  queryClient: QueryClient,
  queryFn: () => Promise<Workspace[]> = workspacesQueryOptions().queryFn,
) {
  return queryClient.fetchQuery({ queryKey: workspacesQueryKey, queryFn, staleTime: 0 });
}

export function useWorkspaces() {
  return useQuery(workspacesQueryOptions());
}
