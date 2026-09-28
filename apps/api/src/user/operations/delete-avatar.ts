import { eq } from "drizzle-orm";
import db, { schema } from "../../database";

/**
 * Removes the user's stored avatar and clears `user.image`.
 *
 * Both writes are in one transaction: an upload keeps the two in step (see
 * `save-avatar.ts`), so a removal that cleared only one of them would leave the
 * profile pointing at a URL that no longer resolves.
 *
 * Succeeds when there was nothing to remove, so a retry or a double-submit is
 * not an error.
 */
async function deleteAvatar(userId: string): Promise<{ deleted: boolean }> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .delete(schema.userAvatarTable)
      .where(eq(schema.userAvatarTable.userId, userId))
      .returning({ id: schema.userAvatarTable.id });

    await tx.update(schema.userTable).set({ image: null }).where(eq(schema.userTable.id, userId));

    return { deleted: rows.length > 0 };
  });
}

export default deleteAvatar;
