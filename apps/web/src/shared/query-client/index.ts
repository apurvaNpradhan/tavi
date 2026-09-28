import * as Sentry from "@sentry/react";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { handleUnauthorized, isUnauthorizedError } from "@/shared/api/http-error";

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Failed to fetch") ||
    error.message.includes("NetworkError") ||
    error.message.includes("Load failed") ||
    error.message.includes("CORS")
  );
}

function isCancellationError(error: Error): boolean {
  return error.name === "AbortError" || error.message.toLowerCase().includes("aborted");
}

/**
 * In-module cooldown so an offline tab does not emit one Sentry event per cache
 * entry on every retry tick.
 */
const NETWORK_REPORT_COOLDOWN_MS = 60_000;
const networkErrorCooldowns = new Map<string, number>();

function captureCacheError(error: unknown, context: "query" | "mutation") {
  if (!(error instanceof Error)) return;
  if (isCancellationError(error)) return;

  const isNetwork = isNetworkError(error);

  if (isNetwork) {
    const key = `${context}:${error.message}`;
    const lastSent = networkErrorCooldowns.get(key);
    const now = Date.now();
    if (lastSent !== undefined && now - lastSent < NETWORK_REPORT_COOLDOWN_MS) {
      return;
    }
    networkErrorCooldowns.set(key, now);
    if (networkErrorCooldowns.size > 50) networkErrorCooldowns.clear();
  }

  Sentry.captureException(error, {
    tags: { area: `${isNetwork ? "network" : "api"}.${context}` },
  });
}

/**
 * One place for cross-cutting request behaviour: a 401 sends the user to
 * sign-in, network errors are reported once per minute, and cancellations are
 * ignored. Individual hooks therefore only own their cache keys.
 */
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }
      captureCacheError(error, "query");
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }
      captureCacheError(error, "mutation");
    },
  }),
  defaultOptions: {
    queries: {
      // Mutations invalidate the caches they affect; this bounds how stale a
      // background re-read can be for data fetched by a different path.
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (isUnauthorizedError(error)) return false;
        return isNetworkError(error) && failureCount < 2;
      },
    },
  },
});

export default queryClient;
