import { createId } from "@paralleldrive/cuid2";
import { type MigrationMeta, readMigrationFiles } from "drizzle-orm/migrator";
import { describe, expect, it } from "vitest";
import { getDatabasePool } from "../../apps/api/src/database";

/**
 * Exercises the deduplication inside `0002_bored_beast.sql` the way an existing
 * installation would hit it: plant the duplicate rows the old racy seeds could
 * produce, then apply the migration and assert it cleans them up before adding
 * the unique indexes.
 *
 * The shared suite applies every migration to an empty database, so it can
 * never observe this path. The schema is already migrated here, so the test
 * drops the two indexes inside a transaction, inserts duplicates, replays the
 * real migration statements, then rolls everything back. PostgreSQL DDL is
 * transactional, so the rollback restores the original indexes and no other
 * test sees the mutation.
 */

const migrationsFolder = new URL("../../apps/api/drizzle", import.meta.url).pathname;

function migrationAt(index: number): MigrationMeta {
  const migration = readMigrationFiles({ migrationsFolder })[index];
  if (!migration) throw new Error(`Expected migration at index ${index}`);
  return migration;
}

describe("0002 migration deduplication", () => {
  it("keeps ownership, keeps the latest role edit, then enforces uniqueness", async () => {
    const client = await getDatabasePool().connect();

    const workspaceId = createId();
    const userId = createId();

    try {
      await client.query("begin");
      await client.query('drop index "workspace_member_workspaceId_userId_uidx"');
      await client.query('drop index "workspace_role_workspaceId_role_uidx"');

      await client.query(
        `insert into workspace (id, name, slug, created_at) values ($1, 'Dedup Workspace', $2, now())`,
        [workspaceId, `ws-${workspaceId}`],
      );
      await client.query(
        `insert into "user" (id, name, email, email_verified, created_at, updated_at)
         values ($1, 'Dedup User', $2, true, now(), now())`,
        [userId, `${userId}@example.com`],
      );

      // The earliest membership is the least privileged; deduplication must
      // keep the owner row or the workspace loses its last owner.
      await client.query(
        `insert into workspace_member (id, workspace_id, user_id, role, joined_at) values
           ($1, $2, $3, 'member', now() - interval '1 hour'),
           ($4, $2, $3, 'owner', now())`,
        [createId(), workspaceId, userId, createId()],
      );

      // Two definitions of `viewer`; the later edit carries the widened
      // permission and must be the survivor.
      await client.query(
        `insert into workspace_role (id, workspace_id, role, permission, created_at, updated_at) values
           ($1, $2, 'viewer', '{"workspace":["read"]}', now(), now() - interval '1 hour'),
           ($3, $2, 'viewer', '{"workspace":["read","delete"]}', now(), now())`,
        [createId(), workspaceId, createId()],
      );

      // Replay the real migration: dedupe, then create the unique indexes.
      for (const statement of migrationAt(2).sql) {
        await client.query(statement);
      }

      const memberships = await client.query<{ role: string }>(
        `select role from workspace_member where workspace_id = $1 and user_id = $2`,
        [workspaceId, userId],
      );
      expect(memberships.rows).toEqual([{ role: "owner" }]);

      const roles = await client.query<{ permission: string }>(
        `select permission from workspace_role where workspace_id = $1 and role = 'viewer'`,
        [workspaceId],
      );
      expect(roles.rows).toHaveLength(1);
      expect(JSON.parse(roles.rows[0]!.permission)).toEqual({ workspace: ["read", "delete"] });

      // The migration's indexes now reject what it just cleaned up. Each
      // expected failure aborts the transaction, so roll back to a savepoint
      // before the next statement.
      await client.query("savepoint membership_duplicate");
      await expect(
        client.query(
          `insert into workspace_member (id, workspace_id, user_id, role, joined_at)
           values ($1, $2, $3, 'member', now())`,
          [createId(), workspaceId, userId],
        ),
      ).rejects.toMatchObject({ code: "23505" });
      await client.query("rollback to savepoint membership_duplicate");

      await client.query("savepoint role_duplicate");
      await expect(
        client.query(
          `insert into workspace_role (id, workspace_id, role, permission, created_at, updated_at)
           values ($1, $2, 'viewer', '{}', now(), now())`,
          [createId(), workspaceId],
        ),
      ).rejects.toMatchObject({ code: "23505" });
      await client.query("rollback to savepoint role_duplicate");
    } finally {
      // Always unwind, including after a failed assertion, so the connection is
      // never returned to the pool mid-transaction.
      await client.query("rollback").catch(() => {});
      client.release();
    }
  });
});
