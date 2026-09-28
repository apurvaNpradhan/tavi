import type { User } from "better-auth/types";

/**
 * Maps a generic OIDC profile onto the fields this app stores.
 *
 * Providers disagree about claim shapes (`sub` vs `id`, `picture` vs
 * `avatar_url`), so each is probed in turn. Only `id` and `email` are required:
 * rejecting a profile we cannot identify is safer than creating a half-formed
 * account.
 */
export function mapCustomOAuthProfileToUser(
  profile: Record<string, unknown>,
): Partial<User> & { id: string; email: string } {
  const readString = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = profile[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return undefined;
  };

  const id = readString("sub", "id", "user_id", "oid");
  const email = readString("email", "mail", "preferred_username");

  if (!id) {
    throw new Error("OIDC profile is missing a subject identifier.");
  }
  if (!email) {
    throw new Error("OIDC profile is missing an email address.");
  }

  return {
    id,
    email,
    name:
      readString("name", "display_name", "preferred_username", "nickname") ??
      email.split("@")[0] ??
      email,
    image: readString("picture", "avatar_url", "image"),
  };
}
