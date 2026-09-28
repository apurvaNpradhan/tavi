import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshSession } from "@/features/authentication/hooks/use-session";
import { client } from "@/shared/api/api-client";

/**
 * Removes the stored avatar.
 *
 * The API clears `user.image` in the same transaction as the row, so the session
 * refresh below is what takes the image out of the UI. Succeeds when there was
 * nothing to remove, which keeps a double-submit from surfacing an error.
 */
export function useRemoveUserAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => client.user.deleteAvatar(),
    onSuccess: () => refreshSession(queryClient),
  });
}

export default useRemoveUserAvatar;
