import * as Sentry from "@sentry/react";
import { env } from "@tavi/env/web";

/**
 * Optional error reporting. With no DSN this is a no-op, so local development
 * and self-hosted installs stay quiet by default.
 */
const dsn = env.VITE_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: env.VITE_SENTRY_TRACES_SAMPLE_RATE,
  });
}
