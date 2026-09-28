import { hashKey, type QueryClient } from "@tanstack/react-query";

/**
 * Marks the cached session signed out and drops every other cached response.
 *
 * Clearing the cache is also what navigates: the root layout keeps the
 * signed-out, onboarding, and authenticated routes inside `Stack.Protected`
 * guards driven by the session query, so the guards only re-evaluate once that
 * query notifies its observers. Notifying first and removing the rest afterwards
 * keeps the observed query — and its observers — alive. The obvious
 * `queryClient.clear()` is the trap this replaces: it destroys the query the
 * guards are subscribed to, so a following `setQueryData` writes to a fresh
 * query nobody is watching and the app stays on the authenticated stack.
 */
export function clearSessionCaches(
  queryClient: QueryClient,
  sessionQueryKey: readonly unknown[],
): void {
  queryClient.setQueryData(sessionQueryKey, null);
  const sessionQueryHash = hashKey(sessionQueryKey);
  queryClient.removeQueries({ predicate: (query) => query.queryHash !== sessionQueryHash });
}
