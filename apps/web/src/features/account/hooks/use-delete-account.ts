import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/shared/auth/auth-client";

/**
 * Where the browser lands once the emailed link has removed the account.
 *
 * Absolute, not relative: Better Auth rewrites a relative target against the
 * API origin, which is a different origin from the app except when the two are
 * served together under one host.
 */
function deleteAccountCallbackUrl(): string {
  return new URL("/auth/goodbye", window.location.origin).toString();
}

/**
 * Requests deletion of the caller's account.
 *
 * Nothing is deleted here. Better Auth mails a single-use confirmation link to
 * the account address, and only opening that link removes the account, so a
 * resolved mutation means the request was accepted — not that it completed.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.deleteUser({
        callbackURL: deleteAccountCallbackUrl(),
      });

      if (error) {
        throw new Error(error.message || "Delete request failed");
      }
    },
  });
}

export default useDeleteAccount;
