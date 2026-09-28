import { resolveApiBaseUrl } from "@tavi/libs";

/** Mobile runtime addresses; localhost is suitable only for local simulators. */
export const apiBaseUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

/** Browser app address used for management actions unavailable on mobile. */
export const webBaseUrl = (process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:5173").replace(
  /\/+$/,
  "",
);

/** Optional public Sentry DSN; unset disables native error reporting. */
export const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
