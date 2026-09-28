import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshSession } from "@/features/authentication/hooks/use-session";
import { client } from "@/shared/api/api-client";
import type { PreparedAvatar } from "@/features/account/prepare-avatar-image";

/**
 * Stores an avatar that has already been cropped and re-encoded.
 *
 * Takes the prepared payload rather than a `File` so a caller that previews the
 * normalized image — the onboarding wizard does — does not run the canvas twice
 * and uploads exactly what the user was shown. Call `prepareAvatarImage` first.
 *
 * The API repoints `user.image` at the stored avatar within the same request, so
 * the only follow-up needed is a session refresh: the cached session still holds
 * the previous URL, and the mutation that just ran is what has to displace it.
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prepared: PreparedAvatar) => client.user.uploadAvatar(prepared),
    onSuccess: () => refreshSession(queryClient),
  });
}

export default useUploadAvatar;
