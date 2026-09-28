import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/shared/auth/auth-client";

type ApiKeyListResult = Awaited<ReturnType<typeof authClient.apiKey.list>>;

/** One API key as the API returns it. The plaintext `key` is never included here. */
export type ApiKey = NonNullable<NonNullable<ApiKeyListResult["data"]>["apiKeys"]>[number];

/** Shared by the list and every mutation that changes it. */
export const apiKeysQueryKey = ["api-keys"] as const;

/**
 * The caller's API keys.
 *
 * The list endpoint strips the plaintext key, so what comes back is metadata
 * only — the first characters (`start`), the name and the dates.
 */
export function apiKeysQueryOptions() {
  return {
    queryKey: apiKeysQueryKey,
    staleTime: 30_000,
    queryFn: async (): Promise<ApiKey[]> => {
      const { data, error } = await authClient.apiKey.list({ query: { limit: 100 } });

      if (error) {
        throw new Error(error.message || "Could not load API keys");
      }

      return data?.apiKeys ?? [];
    },
  };
}

export function useApiKeys() {
  return useQuery(apiKeysQueryOptions());
}
