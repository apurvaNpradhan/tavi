import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Browser-side configuration, validated in the client bundle.
 *
 * Only `VITE_`-prefixed variables are reachable here; anything else is rejected
 * by `clientPrefix`, which is what keeps a server secret from accidentally
 * shipping to the browser.
 */
export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    // Unset means the API is served from this same origin (the bundled nginx
    // image and the Vite dev proxy), so one build works for any hostname.
    VITE_API_URL: z.url().optional(),
    VITE_SENTRY_DSN: z.string().optional(),
    VITE_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  },
  // SAFETY: Vite statically replaces `import.meta.env`; the assertion supplies
  // the indexable shape t3-env's `runtimeEnv` expects without pulling in Vite
  // types (keeps this package buildable with plain `tsc`).
  runtimeEnv: (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env,
  emptyStringAsUndefined: true,
});
