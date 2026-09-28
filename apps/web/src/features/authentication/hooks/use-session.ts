import { type QueryClient, useQuery } from "@tanstack/react-query";
import { authClient } from "@/shared/auth/auth-client";
import { normalizeClientError } from "@/shared/api/http-error";

type SessionResult = Awaited<ReturnType<typeof authClient.getSession>>;

/**
 * The server's session payload.
 *
 * `null` means definitively signed out. A session read that *failed* never
 * reaches callers as `null`: it throws, so an unreachable API cannot be
 * mistaken for a signed-out user.
 */
export type AppSession = NonNullable<SessionResult["data"]>;

export const sessionQueryKey = ["auth", "session"] as const;

/**
 * The caller's session, shared by the auth provider and every route guard.
 *
 * All of them read this one cache entry, so a single in-flight `getSession()`
 * request serves the guard, the provider and the post-sign-in redirect instead
 * of each issuing its own. `staleTime` is what makes `ensureQueryData` in a
 * route guard a cache hit rather than another round trip.
 */
export function sessionQueryOptions() {
  return {
    queryKey: sessionQueryKey,
    staleTime: 30_000,
    queryFn: async (): Promise<AppSession | null> => {
      const { data, error } = await authClient.getSession();

      // A non-2xx response resolves with `error` set and `data: null` rather
      // than rejecting. Returning that as `null` would report a signed-in user
      // as signed out — the dev proxy answers 500 for every request while the
      // API restarts — so the failure is raised to reject the route guard,
      // retry, and surface the router's error boundary instead.
      if (error) {
        throw normalizeClientError(error, "Could not read the session");
      }

      return data ?? null;
    },
  };
}

export function useAppSession() {
  return useQuery(sessionQueryOptions());
}

/**
 * Re-reads the session now, bypassing the cached entry's `staleTime`.
 *
 * A mutation that changes a server-owned field on the user — the name, or the
 * avatar that `user.image` points at — has to land in the shared cache the
 * guards and the account menu read, or the UI keeps showing the old value until
 * the entry goes stale on its own.
 */
export async function refreshSession(queryClient: QueryClient) {
  await queryClient.fetchQuery({ ...sessionQueryOptions(), staleTime: 0 });
}
