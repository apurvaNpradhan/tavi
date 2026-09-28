import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/shared/auth/auth-client";
import { normalizeClientError } from "@/shared/api/http-error";

type SessionListResult = Awaited<ReturnType<typeof authClient.listSessions>>;

/** One signed-in session. */
export type Session = NonNullable<SessionListResult["data"]>[number];

export const sessionsQueryKey = ["sessions"] as const;

/**
 * Raised when the session is too old to list sessions.
 *
 * The endpoint requires a session created within the last 24 hours and answers
 * 403 with this code otherwise. It is a distinct state rather than a failure —
 * the list is not empty, it is unavailable — so the section explains it instead
 * of showing an error or an empty table.
 */
export class SessionNotFreshError extends Error {
  constructor() {
    super("Session is not fresh enough to list sessions");
    this.name = "SessionNotFreshError";
  }
}

export function sessionsQueryOptions() {
  return {
    queryKey: sessionsQueryKey,
    // Deliberately not cached long: this is a security surface, and a stale list
    // could hide a session the user just revoked elsewhere.
    staleTime: 0,
    // The app relies on explicit mutation invalidation for freshness, so a
    // security list must refresh whenever the settings route remounts.
    refetchOnMount: true,
    queryFn: async (): Promise<Session[]> => {
      const { data, error } = await authClient.listSessions();

      if (error) {
        if (error.code === "SESSION_NOT_FRESH") {
          throw new SessionNotFreshError();
        }

        throw normalizeClientError(error, "Could not load sessions");
      }

      return data ?? [];
    },
  };
}

export function useSessions() {
  return useQuery(sessionsQueryOptions());
}

/** Revokes one session by its token. */
export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { error } = await authClient.revokeSession({ token });

      if (error) {
        throw normalizeClientError(error, "Could not revoke the session");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
  });
}

/** Signs out every session except this one. */
export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.revokeOtherSessions();

      if (error) {
        throw normalizeClientError(error, "Could not sign out other devices");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
  });
}
