import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../../database";

/**
 * The authenticated user's profile, read fresh from the database so an
 * administrator's role change is reflected immediately.
 */
async function getCurrentUser(userId: string) {
  const [row] = await db
    .select({
      id: schema.userTable.id,
      name: schema.userTable.name,
      email: schema.userTable.email,
      image: schema.userTable.image,
      locale: schema.userTable.locale,
      role: schema.userTable.role,
      isAnonymous: schema.userTable.isAnonymous,
      onboardingStep: schema.userTable.onboardingStep,
    })
    .from(schema.userTable)
    .where(eq(schema.userTable.id, userId))
    .limit(1);

  if (!row) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return row;
}

export default getCurrentUser;
