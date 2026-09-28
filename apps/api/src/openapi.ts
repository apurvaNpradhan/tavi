import { z } from "@hono/zod-openapi";

export { createRoute } from "@hono/zod-openapi";
export { z };

/** A timestamp serialized in responses as an RFC 3339 string. */
export const responseTimestamp = z.date().openapi({ type: "string", format: "date-time" });

/**
 * Normalizes the configured API URL into an OpenAPI `servers` entry.
 *
 * The document's paths live under the `/api` mount, so the server URL must
 * carry that prefix — otherwise interactive clients such as the Scalar
 * reference resolve every operation against the bare origin and 404. Mirrors
 * `resolveApiBaseUrl` in `@tavi/libs` and is idempotent when the
 * configured URL already ends in `/api`.
 */
export function normalizeApiServerUrl(apiUrl: string): string {
  const baseUrl = apiUrl.trim().replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}
