import { createId } from "@paralleldrive/cuid2";
import { getDatabasePool } from "../../../apps/api/src/database";

/**
 * Removes all rows while keeping the schema.
 *
 * `TRUNCATE ... CASCADE` in one statement is used rather than per-table
 * deletes so foreign-key ordering never matters. The Drizzle migrations table is
 * preserved so `migrate()` is not re-run between tests.
 */
export async function truncateAllTables(): Promise<void> {
  const { rows } = await getDatabasePool().query<{ tablename: string }>(
    `select tablename from pg_tables
      where schemaname = 'public'
        and tablename not like '\\_\\_drizzle%'`,
  );

  if (rows.length === 0) return;

  const list = rows.map((row) => `"${row.tablename}"`).join(", ");
  await getDatabasePool().query(`truncate table ${list} restart identity cascade`);
}

export async function countRows(table: string): Promise<number> {
  const { rows } = await getDatabasePool().query<{ count: string }>(
    `select count(*)::text as count from "${table}"`,
  );
  return Number(rows[0]?.count ?? 0);
}

/** Creates a user row directly, bypassing Better Auth, for setup fixtures. */
export async function createUser(options?: {
  email?: string;
  name?: string;
  role?: string | null;
  isAnonymous?: boolean;
}): Promise<{ id: string; email: string }> {
  const id = createId();
  const email = options?.email ?? `${id}@example.com`;

  await getDatabasePool().query(
    `insert into "user" (id, name, email, email_verified, role, is_anonymous, created_at, updated_at)
     values ($1, $2, $3, true, $4, $5, now(), now())`,
    [
      id,
      options?.name ?? "Test User",
      email,
      options?.role ?? "user",
      options?.isAnonymous ?? false,
    ],
  );

  return { id, email };
}

export async function createWorkspace(name = "Test Workspace"): Promise<string> {
  const id = createId();
  await getDatabasePool().query(
    `insert into workspace (id, name, slug, created_at) values ($1, $2, $3, now())`,
    [id, name, `ws-${id}`],
  );
  return id;
}

export async function addMember(workspaceId: string, userId: string, role: string): Promise<void> {
  await getDatabasePool().query(
    `insert into workspace_member (id, workspace_id, user_id, role, joined_at)
     values ($1, $2, $3, $4, now())`,
    [createId(), workspaceId, userId, role],
  );
}
