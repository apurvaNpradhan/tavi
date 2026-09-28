import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { Workspace } from "./use-workspaces";
import { fetchWorkspacesForRoute, workspacesQueryKey } from "./use-workspaces";

describe("fetchWorkspacesForRoute", () => {
  it("refetches a cached list so a newly created workspace can resolve", async () => {
    const queryClient = new QueryClient();
    const oldWorkspace = { id: "old", slug: "old-workspace", name: "Old workspace" } as Workspace;
    const createdWorkspace = { id: "new", slug: "pegasus", name: "Pegasus" } as Workspace;
    const loadWorkspaces = vi
      .fn<() => Promise<Workspace[]>>()
      .mockResolvedValue([oldWorkspace, createdWorkspace]);
    queryClient.setQueryData(workspacesQueryKey, [oldWorkspace]);

    const workspaces = await fetchWorkspacesForRoute(queryClient, loadWorkspaces);

    expect(loadWorkspaces).toHaveBeenCalledOnce();
    expect(workspaces).toContainEqual(createdWorkspace);
    queryClient.clear();
  });
});
