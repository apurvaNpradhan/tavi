import { beforeEach, describe, expect, it } from "vitest";
import { getDatabasePool } from "../../apps/api/src/database";
import {
  hasAdministrator,
  hasRegisteredUsers,
  isAdministrator,
  promoteInitialAdministrator,
} from "../../apps/api/src/utils/instance-bootstrap";
import { createUser, truncateAllTables } from "./helpers/db";

/**
 * First-user promotion is the highest-risk bootstrap path in the app: it runs
 * from a Better Auth database hook, so a broken predicate does not throw — the
 * instance simply ends up with no administrator and the failure is only visible
 * much later. These tests exercise it against real SQL because the bug they
 * guard against (a predicate that matches no rows) is invisible to unit tests
 * with a mocked database.
 */
describe("instance bootstrap", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("promotes the first real user to administrator", async () => {
    const user = await createUser({ role: "user" });

    await promoteInitialAdministrator(user.id);

    expect(await isAdministrator(user.id)).toBe(true);
    expect(await hasAdministrator()).toBe(true);
  });

  it("promotes a user whose role column is null", async () => {
    // The admin plugin is optional; without it the column can be NULL.
    const user = await createUser({ role: null });

    await promoteInitialAdministrator(user.id);

    expect(await isAdministrator(user.id)).toBe(true);
  });

  it("does not promote a second user once an administrator exists", async () => {
    const first = await createUser({ role: "user" });
    const second = await createUser({ role: "user" });

    await promoteInitialAdministrator(first.id);
    await promoteInitialAdministrator(second.id);

    expect(await isAdministrator(first.id)).toBe(true);
    expect(await isAdministrator(second.id)).toBe(false);
  });

  it("never promotes an anonymous guest, even on an empty instance", async () => {
    const guest = await createUser({ role: "user", isAnonymous: true });

    await promoteInitialAdministrator(guest.id);

    expect(await isAdministrator(guest.id)).toBe(false);
    expect(await hasRegisteredUsers()).toBe(false);
  });

  it("still promotes the first real user when only guests exist", async () => {
    const guest = await createUser({ role: "user", isAnonymous: true });
    await promoteInitialAdministrator(guest.id);

    const real = await createUser({ role: "user" });
    await promoteInitialAdministrator(real.id);

    expect(await isAdministrator(real.id)).toBe(true);
    expect(await isAdministrator(guest.id)).toBe(false);
  });

  it("is idempotent", async () => {
    const user = await createUser({ role: "user" });

    await promoteInitialAdministrator(user.id);
    await promoteInitialAdministrator(user.id);

    expect(await isAdministrator(user.id)).toBe(true);
  });

  it("does not demote an existing administrator", async () => {
    const admin = await createUser({ role: "admin" });
    const other = await createUser({ role: "user" });

    await promoteInitialAdministrator(other.id);

    expect(await isAdministrator(admin.id)).toBe(true);
    expect(await isAdministrator(other.id)).toBe(false);
  });

  it("promotes exactly one administrator under concurrent first signups", async () => {
    // The pre-lock implementation ran the guard as a single `UPDATE ... WHERE
    // NOT EXISTS (admin)`. Because it targets a different row per user, the
    // statements take no shared lock and all read a snapshot with no admin, so
    // every concurrent caller promoted itself. This asserts the invariant the
    // advisory lock exists to preserve.
    const users = await Promise.all(Array.from({ length: 8 }, () => createUser({ role: "user" })));

    await Promise.all(users.map((user) => promoteInitialAdministrator(user.id)));

    const { rows } = await getDatabasePool().query<{ count: string }>(
      `select count(*)::text as count from "user" where role = 'admin'`,
    );
    expect(Number(rows[0]?.count)).toBe(1);

    const promoted = await Promise.all(users.map((user) => isAdministrator(user.id)));
    expect(promoted.filter(Boolean)).toHaveLength(1);
  });

  it("reports whether any registered users exist", async () => {
    expect(await hasRegisteredUsers()).toBe(false);

    await createUser({ role: "user" });

    expect(await hasRegisteredUsers()).toBe(true);
  });
});
