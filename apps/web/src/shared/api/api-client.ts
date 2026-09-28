import { env } from "@tavi/env/web";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createApiClient, resolveApiBaseUrl } from "@tavi/libs";

/**
 * The single API client for the app.
 *
 * The shared package exposes a factory so it stays free of bundler-specific
 * env types; this is the one place that knows how *this* app is configured.
 */
/**
 * The API origin.
 *
 * When `VITE_API_URL` is unset the app assumes the API is served from its own
 * origin. That is the case in the bundled container image (nginx proxies `/api`
 * to the API service), and it means one build works for any hostname without
 * baking the URL in at build time.
 *
 * Callers that want the mounted API router should use `apiBaseUrl()`. Better
 * Auth needs the bare origin here, because it appends its own `/api/auth`
 * basePath and would otherwise post to double-prefixed paths.
 */
export function apiOrigin(): string {
  return env.VITE_API_URL?.replace(/\/+$/, "") || window.location.origin;
}

/**
 * The API base URL, including the `/api` prefix the router is mounted at.
 */
function apiBaseUrl(): string {
  return resolveApiBaseUrl(apiOrigin());
}

export const { client } = createApiClient({
  apiUrl: apiBaseUrl(),
});
export const orpc = createTanstackQueryUtils(client);
