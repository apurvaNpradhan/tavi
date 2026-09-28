import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../../database";
import { buildAvatarUrl, type DecodedAvatar, decodeAvatarUpload } from "../avatar";
import type { SavedAvatar } from "../output";

/**
 * Stores an avatar, replacing any previous one, and repoints `user.image` at it.
 *
 * Two invariants this owns:
 *
 * 1. **A fresh row id on every save.** The public URL is derived from the id, so
 *    a new id is what makes `Cache-Control: immutable` honest — a cached
 *    response can never serve the previous image. The id is minted here and
 *    written by the `ON CONFLICT` branch, so a replacement is a single
 *    statement rather than a delete followed by an insert.
 * 2. **`user.image` and the stored row agree.** Both are written in one
 *    transaction, so no caller can leave a stored avatar that nothing points
 *    at. `user.image` is Better Auth's column and this writes it directly, the
 *    same way the auth hooks write their own columns.
 */
async function saveAvatar(input: {
  userId: string;
  contentType: string;
  data: string;
}): Promise<SavedAvatar> {
  let decoded: DecodedAvatar;
  try {
    decoded = decodeAvatarUpload(input);
  } catch (error) {
    // `decodeAvatarUpload` is HTTP-agnostic so it stays unit-testable; the
    // translation to a response lives here.
    throw new HTTPException(400, {
      message: error instanceof Error ? error.message : "Invalid avatar upload",
    });
  }

  // Minted here rather than by the column default so the replacement branch can
  // write it too; `ON CONFLICT` only accepts explicit values.
  const avatarId = createId();

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(schema.userAvatarTable)
      .values({
        id: avatarId,
        userId: input.userId,
        mimeType: decoded.mimeType,
        size: decoded.bytes.length,
        data: decoded.bytes,
      })
      .onConflictDoUpdate({
        target: schema.userAvatarTable.userId,
        set: {
          id: avatarId,
          mimeType: decoded.mimeType,
          size: decoded.bytes.length,
          data: decoded.bytes,
        },
      })
      .returning({ id: schema.userAvatarTable.id });

    if (!row) {
      throw new HTTPException(500, { message: "Could not save avatar" });
    }

    await tx
      .update(schema.userTable)
      .set({ image: buildAvatarUrl(row.id) })
      .where(eq(schema.userTable.id, input.userId));

    return row.id;
  });

  return { id, url: buildAvatarUrl(id), size: decoded.bytes.length };
}

export default saveAvatar;
