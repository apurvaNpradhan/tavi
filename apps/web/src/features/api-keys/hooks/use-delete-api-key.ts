import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/shared/auth/auth-client";
import { normalizeClientError } from "@/shared/api/http-error";
import { apiKeysQueryKey } from "@/features/api-keys/hooks/use-api-keys";

/**
 * Revokes an API key.
 *
 * The endpoint hard-deletes the row rather than disabling it, so this cannot be
 * undone and the confirmation in front of it is the only guard.
 */
export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await authClient.apiKey.delete({ keyId });

      if (error) {
        throw normalizeClientError(error, "Could not revoke the API key");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiKeysQueryKey });
    },
  });
}

export default useDeleteApiKey;
