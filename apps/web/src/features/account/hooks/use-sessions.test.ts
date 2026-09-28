import { describe, expect, it } from "vitest";
import { sessionsQueryOptions } from "./use-sessions";

describe("sessionsQueryOptions", () => {
  it("refetches when the security list mounts again", () => {
    expect(sessionsQueryOptions()).toMatchObject({
      staleTime: 0,
      refetchOnMount: true,
    });
  });
});
