/**
 * Resolves the API base URL.
 *
 * If the value already ends with `/api` it is returned as-is, otherwise `/api`
 * is appended, so callers always end up talking to the mounted API router
 * rather than the bare origin.
 */
export function resolveApiBaseUrl(rawApiUrl: string | undefined): string {
  const raw = rawApiUrl?.trim() || "http://localhost:1337";
  const baseUrl = raw.replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}
