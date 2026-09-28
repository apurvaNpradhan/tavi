import type { Context } from "hono";

type FakeVariables = {
  userId?: string;
  workspaceId?: string;
  apiKey?: {
    id: string;
    userId: string;
    enabled: boolean;
    permissions: Record<string, string[]> | null;
  };
};

/**
 * Minimal stand-in for a Hono request context.
 *
 * The permission helpers only read `c.get(...)`, so a map-backed object is
 * sufficient and keeps these tests focused on database behaviour rather than
 * on spinning up an HTTP server.
 */
export function fakeContext(variables: FakeVariables): Context {
  const store = new Map<string, unknown>(Object.entries(variables));

  // SAFETY: `requireWorkspacePermission` and `hasWorkspacePermission` only call
  // `c.get(key)`. Providing that single method is enough to exercise them; the
  // `Pick` binding keeps the object's precise type so the single assertion to
  // the full `Context` stays a deliberate, documented narrowing.
  const context: Pick<Context, "get"> = {
    get: (key: string) => store.get(key),
  };
  return context as Context;
}
