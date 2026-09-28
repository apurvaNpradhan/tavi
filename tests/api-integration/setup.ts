import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll } from "vitest";
import { getDatabase, getDatabasePool } from "../../apps/api/src/database";
import { truncateAllTables } from "./helpers/db";

/**
 * Prepares the test database once per suite.
 *
 * `DATABASE_URL` must point at a disposable database; the suite truncates every
 * table. Refusing to run without it is intentional — silently falling back to a
 * default would risk pointing destructive truncation at a real database.
 */
beforeAll(async () => {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "Integration tests need DATABASE_URL pointing at a throwaway PostgreSQL database. " +
        "Start one with: docker compose -f compose.local.yml up -d postgres",
    );
  }

  // Applying the real migrations (not a schema push) means a broken migration
  // fails the suite, which is the point.
  await migrate(getDatabase(), {
    migrationsFolder: new URL("../../apps/api/drizzle", import.meta.url).pathname,
  });
});

afterAll(async () => {
  await truncateAllTables().catch(() => {});
  await getDatabasePool().end();
});
