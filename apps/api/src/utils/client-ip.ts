import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context, Next } from "hono";

/**
 * Records the real peer address on a header Better Auth is configured to trust
 * (`ipAddressHeaders: ["x-tavi-client-ip"]`).
 *
 * The socket address is authoritative and the header is always overwritten, so
 * a client cannot spoof its own IP to evade per-IP rate limits. If the API sits
 * behind a reverse proxy, that proxy's address is what appears here.
 */
const HEADER = "x-tavi-client-ip";

export function clientIpMiddleware() {
  return async (c: Context, next: Next) => {
    try {
      const info = getConnInfo(c);
      // Strip the IPv4-mapped IPv6 form so one client maps to a single key.
      const address = info.remote.address?.replace(/^::ffff:/, "");
      if (address) {
        c.req.raw.headers.set(HEADER, address);
      }
    } catch {
      // `getConnInfo` throws when the runtime exposes no socket info (tests use
      // `app.request()` directly). That is expected, not an error.
    }

    return next();
  };
}
