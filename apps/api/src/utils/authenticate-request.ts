import type { Session, User } from "better-auth/types";
import { HTTPException } from "hono/http-exception";
import { auth } from "../auth";

export type ApiKey = {
  id: string;
  userId: string;
  enabled: boolean;
  permissions: Record<string, string[]> | null;
};

/**
 * The identity resolved for one request.
 *
 * Kept transport-agnostic so both the Hono middleware (raw routes) and the oRPC
 * authentication middleware share a single credential-resolution path — the
 * security boundary must not diverge between the REST and RPC surfaces.
 */
export type RequestIdentity = {
  userId: string;
  userEmail: string;
  user: User | null;
  session: Session | null;
  /** Present only when the request authenticated with an API key. */
  apiKey?: ApiKey;
};

/**
 * Resolves the caller for every authenticated request.
 *
 * Two credential styles are accepted:
 *  - an API key (`x-api-key`, or `Authorization: Bearer <key>`), used by
 *    automation and the CLI;
 *  - a session cookie or bearer session token, used by the browser.
 *
 * On failure it throws 401. Routes that must stay public are registered before
 * the authentication boundary and declare `security: []` in OpenAPI.
 */
export async function resolveRequestIdentity(headers: Headers): Promise<RequestIdentity> {
  const apiKeyHeader = headers.get("x-api-key");
  const bearerToken = headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];

  const candidateKey = apiKeyHeader || bearerToken;

  if (candidateKey) {
    // `verifyApiKey` checks the hash, expiry, enabled flag and per-key rate
    // limit; an invalid key falls through to session auth rather than failing
    // outright, because a bearer token may legitimately be a session token.
    const result = await auth.api.verifyApiKey({ body: { key: candidateKey } }).catch(() => null);

    if (result?.valid && result.key) {
      const key = result.key as {
        id: string;
        userId?: string | null;
        referenceId?: string | null;
        enabled?: boolean | null;
        permissions?: Record<string, string[]> | null;
      };

      const ownerId = key.userId ?? key.referenceId;
      if (ownerId && key.enabled !== false) {
        return {
          userId: ownerId,
          userEmail: "",
          user: null,
          session: null,
          apiKey: {
            id: key.id,
            userId: ownerId,
            // Already proven `!== false` by the guard above.
            enabled: true,
            permissions: key.permissions ?? null,
          },
        };
      }
    }
  }

  const session = await auth.api.getSession({ headers });

  if (session?.user) {
    return {
      userId: session.user.id,
      userEmail: session.user.email,
      user: session.user,
      session: session.session,
    };
  }

  throw new HTTPException(401, { message: "Unauthorized" });
}
