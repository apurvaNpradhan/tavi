import * as Sentry from "@sentry/react-native";
import { sentryDsn } from "./shared/runtime-config";

/** Initializes optional native error reporting without PII or performance traces. */
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
    enableAutoSessionTracking: false,
  });
}
