import type { Session, User } from "better-auth/types";

/** An API key authenticated by `resolveRequestIdentity`. */
type ApiKey = {
  id: string;
  userId: string;
  enabled: boolean;
  permissions: Record<string, string[]> | null;
};

/** Values the raw Hono routes place on the request context. */
export type ApiVariables = {
  user: User | null;
  session: Session | null;
  userId: string;
  userEmail: string;
  apiKey?: ApiKey;
};

/** Hono environment for the API's OpenAPI app. */
export type ApiHonoEnv = { Variables: ApiVariables };
