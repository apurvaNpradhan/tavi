import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createApiClient } from "@tavi/libs";
import { authClient } from "../features/auth/auth-client";
import { apiBaseUrl } from "./runtime-config";

/** Typed native oRPC client that explicitly forwards Better Auth session cookies. */
export const { client } = createApiClient({
  apiUrl: apiBaseUrl,
  headers: async (): Promise<Record<string, string>> => {
    const cookie = await authClient.getCookie();
    return cookie ? { Cookie: cookie } : {};
  },
});

/** TanStack Query helpers generated from the shared Tavi API router. */
export const orpc = createTanstackQueryUtils(client);
