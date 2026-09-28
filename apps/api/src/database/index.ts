import * as Sentry from "@sentry/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as relations from "./relations";
import { resolveDatabaseConnectionString } from "./resolve-database-url";
import * as tables from "./schema";

/**
 * Single schema object handed to both Drizzle and Better Auth's drizzle
 * adapter. Relation objects live alongside the tables so `db.query.*` exposes
 * nested relations without extra wiring at call sites.
 */
export const schema = { ...tables, ...relations };

type DatabaseInstance = ReturnType<typeof drizzle<typeof schema>>;

let pool: Pool | undefined;
let dbInstance: DatabaseInstance | undefined;

export function getDatabasePool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: resolveDatabaseConnectionString(),
      // Fail fast rather than hanging every request when the database is
      // unreachable (e.g. a container that has not finished starting).
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      max: 10,
    });

    // Required, not optional. `pg` emits `error` on the pool when a client that
    // is *idle* in the pool loses its connection — a PostgreSQL restart, a
    // failover, or an administrator running pg_terminate_backend. With no
    // listener that becomes an unhandled 'error' event and terminates the
    // process, so an ordinary database restart takes the API down with it.
    //
    // Handling it makes the disconnection recoverable: the pool discards the
    // dead client and opens a fresh one on the next query.
    pool.on("error", (error) => {
      console.error("Idle database client lost its connection; it will be replaced:", error);
      Sentry.captureException(error, { tags: { area: "database" } });
    });
  }

  return pool;
}

export function getDatabase(): DatabaseInstance {
  if (!dbInstance) {
    dbInstance = drizzle(getDatabasePool(), { schema });
  }

  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  await pool?.end();
  pool = undefined;
  dbInstance = undefined;
}

/**
 * Lazy proxy: importing a module that uses `db` must never open a connection at
 * import time. Tests and the migration runner both rely on this, and it keeps
 * `tsx watch` from leaking pools across reloads.
 */
const db = new Proxy({} as DatabaseInstance, {
  get(_target, property) {
    const database = getDatabase();
    const value = database[property as keyof DatabaseInstance];

    if (typeof value === "function") {
      return value.bind(getDatabase());
    }

    return value;
  },
});

export default db;
