import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env } from "@tavi/env/server";

/**
 * Imported before anything else (see `index.ts`) so Sentry can patch
 * auto-instrumentation before modules capture references to it.
 *
 * Reporting is opt-in: with no DSN set this is a no-op, which keeps local dev
 * and self-hosted installs quiet by default.
 */
const dsn = env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
    release: env.SENTRY_RELEASE,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    profileSessionSampleRate: env.SENTRY_PROFILES_SAMPLE_RATE,
    integrations: [nodeProfilingIntegration()],
  });
}
