import { and, eq, sql } from "drizzle-orm";
import db, { schema } from "../database";

/**
 * Transaction-scoped advisory lock that serializes first-admin promotion.
 *
 * The key is arbitrary. It lives in PostgreSQL's single-key advisory-lock space
 * (`pg_advisory_xact_lock(bigint)`), which is distinct from the two-argument
 * locks (`pg_advisory_xact_lock(int, int)`) used for per-workspace mutations, so
 * the two families cannot collide.
 */
const FIRST_ADMINISTRATOR_LOCK_KEY = 20260926;

export async function hasRegisteredUsers(): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.userTable.id })
    .from(schema.userTable)
    // Anonymous guests are not "registered" — an instance with only guests
    // must still promote its first real signup to administrator.
    .where(sql`${schema.userTable.isAnonymous} is not true`)
    .limit(1);

  return Boolean(row);
}

export async function hasAdministrator(): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.userTable.id })
    .from(schema.userTable)
    .where(eq(schema.userTable.role, "admin"))
    .limit(1);

  return Boolean(row);
}

/**
 * Promotes the first genuine user on a fresh instance to administrator.
 *
 * Runs from the `user.create` database hook. Two details matter:
 *
 *  - The `admin` plugin already assigns `role = 'user'` at insert time, so a
 *    guard of "role must be null" would never match. The accepted starting
 *    states are therefore `NULL` (plugin absent) or `'user'` (plugin default).
 *  - Promotion runs in a transaction that first takes an advisory lock, then
 *    evaluates the "no admin exists" test inside the guarded `UPDATE`. The
 *    lock is what makes this safe under PostgreSQL's default read-committed
 *    isolation: the `NOT EXISTS` subquery on its own takes no lock on the
 *    other rows, so two concurrent first signups can each read a snapshot
 *    containing no admin and both promote. With the lock, the second
 *    transaction blocks until the first commits, then its re-read sees the
 *    committed admin and its `UPDATE` matches no rows.
 *  - Anonymous guests are excluded here, not only at the call site. The caller
 *    (`auth.ts`) checks too, but instance-admin is a security boundary: it must
 *    not depend on every future caller remembering to filter guests.
 */
export async function promoteInitialAdministrator(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${FIRST_ADMINISTRATOR_LOCK_KEY})`);

    await tx.execute(sql`
      UPDATE "user"
      SET role = 'admin',
          updated_at = now()
      WHERE id = ${userId}
        AND (role IS NULL OR role = 'user')
        AND is_anonymous IS NOT TRUE
        AND NOT EXISTS (
          SELECT 1
          FROM "user" existing
          WHERE existing.role = 'admin'
            AND existing.id <> ${userId}
        )
    `);
  });
}

/** Whether a given user is the instance administrator. */
export async function isAdministrator(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.userTable.id })
    .from(schema.userTable)
    .where(and(eq(schema.userTable.id, userId), eq(schema.userTable.role, "admin")))
    .limit(1);

  return Boolean(row);
}
