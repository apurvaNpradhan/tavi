import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/shared/auth/auth-client";
import { toApiKeyCreateRequest } from "@/features/api-keys/api-key-expiry";
import { normalizeClientError } from "@/shared/api/http-error";
import { apiKeysQueryKey } from "@/features/api-keys/hooks/use-api-keys";

type CreateApiKeyInput = {
  name?: string;
  /** Lifetime in days. Omitted means the key never expires. */
  expiresInDays?: number;
};

/**
 * Creates an API key.
 *
 * The response is the only place the plaintext key ever appears — the server
 * stores a hash, and the list endpoint omits the field entirely. The caller must
 * therefore show it before anything else happens, which is why this returns the
 * created key rather than discarding it.
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateApiKeyInput) => {
      const { data, error } = await authClient.apiKey.create(toApiKeyCreateRequest(input));

      if (error) {
        throw normalizeClientError(error, "Could not create the API key");
      }

      if (!data?.key) {
        throw new Error("The API key was created but not returned");
      }

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiKeysQueryKey });
    },
  });
}

export default useCreateApiKey;
