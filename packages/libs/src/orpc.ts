import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { router } from "@tavi/api/router";

export type ApiClientOptions = {
  /** Fully resolved base URL, including the `/api` suffix. */
  apiUrl: string;
  /** Optional per-request headers for clients that manage credentials themselves. */
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
};

/**
 * Builds the typed oRPC client.
 *
 * This is a factory rather than a module-level singleton on purpose: the shared
 * package does not know how the host app exposes configuration (Vite's
 * `import.meta.env`, a runtime `/config.json`, a test fixture). The app reads
 * its own env and passes the value in, which keeps this package free of
 * bundler-specific types.
 *
 * The router is imported as a type only, so no server code reaches the browser
 * bundle: the client speaks the RPC protocol to `/api/rpc`.
 */
export function createApiClient({ apiUrl, headers }: ApiClientOptions) {
  const base = new URL(apiUrl, globalThis.location?.origin ?? "http://localhost");
  // RPCLink types paths as `StandardUrl` (`/...`), which a computed string
  // cannot statically satisfy; a URL pathname always starts with `/`.
  const url = `/${base.pathname.replace(/^\/+|\/+$/g, "")}/rpc` as `/${string}`;

  const link = new RPCLink({
    origin: base.origin,
    url,
    headers,
    fetch: (request, init) => {
      return fetch(request, { ...init, credentials: "include" }).catch((error) => {
        if (error instanceof TypeError && error.message.includes("fetch")) {
          throw new Error(
            `Failed to connect to the API server at ${apiUrl}. This is usually a CORS configuration problem or the server is not running.`,
          );
        }
        throw error;
      });
    },
  });

  const client: RouterClient<typeof router> = createORPCClient(link);

  return { client };
}
