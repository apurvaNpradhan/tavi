import { apiOrigin } from "@/shared/api/api-client";

/**
 * Turns a stored avatar URL into something an `<img>` can load.
 *
 * The API stores `/api/user/avatar/{id}` relative to keep an environment's
 * hostname out of the database (see `buildAvatarUrl`), so a value that already
 * points somewhere else — an OAuth provider's `picture` URL, for instance — is
 * passed through unchanged, and only the API-relative form is re-anchored.
 *
 * The origin is a parameter rather than read inline so the function stays pure
 * and testable, the same way `createApiClient` takes its URL instead of reading
 * the environment itself.
 */
export function resolveAvatarSrc(src: string | undefined, origin = apiOrigin()) {
  if (!src?.startsWith("/api/")) return src;
  return `${origin}${src}`;
}

export default resolveAvatarSrc;
