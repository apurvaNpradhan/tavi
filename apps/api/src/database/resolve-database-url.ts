import { env } from "@tavi/env/server";

/**
 * Resolves the Postgres connection string.
 *
 * `DATABASE_URL` always wins. Otherwise a URL is *derived* from `POSTGRES_*`
 * only when `POSTGRES_PASSWORD`, `POSTGRES_HOST` or `POSTGRES_PORT` is set —
 * `POSTGRES_DB`/`POSTGRES_USER` alone must not silently switch the app onto a
 * derived connection, because those two are commonly present for other reasons.
 */
export function resolveDatabaseConnectionString(): string {
  if (env.DATABASE_URL?.trim()) {
    return env.DATABASE_URL.trim();
  }

  const hasDerivedInput = Boolean(env.POSTGRES_PASSWORD || env.POSTGRES_HOST || env.POSTGRES_PORT);

  if (!hasDerivedInput) {
    throw new Error(
      "No database configured. Set DATABASE_URL, or set POSTGRES_PASSWORD/POSTGRES_HOST/POSTGRES_PORT to derive one.",
    );
  }

  const user = encodeURIComponent(env.POSTGRES_USER || "tavi");
  const password = encodeURIComponent(env.POSTGRES_PASSWORD || "");
  const host = env.POSTGRES_HOST || "localhost";
  const port = env.POSTGRES_PORT || "5432";
  const database = encodeURIComponent(env.POSTGRES_DB || "tavi");

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}
