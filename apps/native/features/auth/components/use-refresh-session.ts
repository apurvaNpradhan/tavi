import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sessionQueryOptions } from "../session";

/**
 * Re-reads the Better Auth session after a sign-in.
 *
 * The root layout keeps signed-out and signed-in routes inside `Stack.Protected`
 * guards, so flipping the guard is what moves the user on. The auth screens
 * never navigate after a successful sign-in — they refresh this query and let
 * the guard do it.
 */
export function useRefreshSession() {
  const queryClient = useQueryClient();

  return useCallback(
    () => queryClient.fetchQuery({ ...sessionQueryOptions(), staleTime: 0 }),
    [queryClient],
  );
}
