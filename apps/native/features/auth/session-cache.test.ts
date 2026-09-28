import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { clearSessionCaches } from "./session-cache";

/** The same shape the root layout observes through `sessionQueryOptions`. */
const sessionQueryKey = ["auth", "session"] as const;
const signedInSession = { user: { id: "user-1" } };

describe("clearSessionCaches", () => {
  it("notifies session observers so the route guards re-evaluate", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(sessionQueryKey, signedInSession);

    const onStoreChange = vi.fn<() => void>();
    const observer = new QueryObserver(queryClient, {
      queryKey: sessionQueryKey,
      queryFn: () => signedInSession,
      staleTime: Number.POSITIVE_INFINITY,
    });
    const unsubscribe = observer.subscribe(onStoreChange);
    onStoreChange.mockClear();

    clearSessionCaches(queryClient, sessionQueryKey);

    expect(onStoreChange).toHaveBeenCalled();
    expect(observer.getCurrentResult().data).toBeNull();
    unsubscribe();
  });

  it("drops other cached responses but keeps the signed-out session", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(sessionQueryKey, signedInSession);
    queryClient.setQueryData(["workspaces"], [{ id: "workspace-1" }]);

    clearSessionCaches(queryClient, sessionQueryKey);

    expect(queryClient.getQueryData(["workspaces"])).toBeUndefined();
    expect(queryClient.getQueryData(sessionQueryKey)).toBeNull();
  });
});
