import { authClient } from "./auth-client";

/** Query key shared by protected navigation and account screens. */
export const sessionQueryKey = ["auth", "session"] as const;

/** Fetches Better Auth session state without turning request failures into sign-out. */
export function sessionQueryOptions() {
  return {
    queryKey: sessionQueryKey,
    staleTime: 30_000,
    queryFn: async () => {
      const result = await authClient.getSession();
      if (result.error) {
        throw new Error(result.error.message || "Could not load your session");
      }
      return result.data ?? null;
    },
  };
}
