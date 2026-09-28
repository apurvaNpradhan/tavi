import { describe, expect, it } from "vitest";
import { getDatabasePool } from "../../apps/api/src/database";

/**
 * Guards the API against a database that goes away and comes back.
 *
 * `pg` emits `error` on the pool when a client that is *idle* in the pool loses
 * its connection. With no `error` listener that is an unhandled event that
 * terminates the Node process — so a routine PostgreSQL restart, a failover, or
 * an administrator running `pg_terminate_backend` would take the API down and
 * leave it down until something restarted it.
 *
 * The failure mode is a process-level crash, so the assertion that matters is
 * simply that this file finishes: if the listener in `getDatabasePool` is ever
 * removed, the runner dies here rather than reporting a normal failure.
 */
describe("database resilience", () => {
  it("keeps serving after PostgreSQL terminates idle connections", async () => {
    const pool = getDatabasePool();

    // Populate the pool so there is at least one idle client to be terminated.
    await Promise.all(Array.from({ length: 3 }, () => pool.query("select 1")));
    expect(pool.totalCount).toBeGreaterThan(0);

    // This is what a restart or a failover looks like from the client's side.
    // `pg_backend_pid()` is excluded so the query itself survives.
    await pool.query(
      `select pg_terminate_backend(pid)
         from pg_stat_activity
        where pid <> pg_backend_pid()
          and datname = current_database()`,
    );

    // Let the terminated sockets report their error before querying again.
    await new Promise((resolve) => setTimeout(resolve, 250));

    // The pool must replace the dead clients rather than propagate the error.
    const { rows } = await pool.query<{ ok: number }>("select 1 as ok");
    expect(rows[0]?.ok).toBe(1);

    // And it must still serve concurrent work afterwards.
    const results = await Promise.all(
      Array.from({ length: 5 }, () => pool.query("select 1 as ok")),
    );
    expect(results).toHaveLength(5);
  });
});
