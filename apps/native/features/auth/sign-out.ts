import { authClient } from "./auth-client";
import { queryClient } from "../../shared/query-client";
import { sessionQueryKey } from "./session";
import { clearSessionCaches } from "./session-cache";

/**
 * Ends the Better Auth session and returns the app to the signed-out guards.
 *
 * The session screens only report failure; navigation belongs to the
 * `Stack.Protected` guards in `app/_layout.tsx`, which re-evaluate when
 * `clearSessionCaches` flips the session query.
 */
export async function signOut(): Promise<void> {
  const result = await authClient.signOut();
  if (result.error) throw new Error(result.error.message || "Could not sign out");
  clearSessionCaches(queryClient, sessionQueryKey);
}
