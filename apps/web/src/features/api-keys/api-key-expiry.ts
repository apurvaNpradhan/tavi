/** Better Auth's API-key lifetime is expressed in seconds. */
export function apiKeyExpirySeconds(days: number | null): number | undefined {
  return days === null ? undefined : days * 86_400;
}

export function toApiKeyCreateRequest(input: { name?: string; expiresInDays?: number | null }) {
  return {
    name: input.name,
    expiresIn: apiKeyExpirySeconds(input.expiresInDays ?? null),
  };
}
