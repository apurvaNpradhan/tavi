import * as Crypto from "expo-crypto";
import { createUniqueWorkspaceSlug, isWorkspaceSlugCollisionError } from "@tavi/libs";
import { authClient } from "../auth/auth-client";
import { queryClient } from "../../shared/query-client";
import { workspacesQueryKey } from "./workspaces";

/** Creates a uniquely slugged workspace and refreshes the membership cache. */
export async function createMobileWorkspace(name: string) {
  const listed = await authClient.organization.list();
  if (listed.error) throw new Error(listed.error.message || "Could not load workspaces");

  const usedSlugs = (listed.data ?? []).map((workspace) => workspace.slug);
  let slug = createUniqueWorkspaceSlug(name, usedSlugs, Crypto.randomUUID);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await authClient.organization.create({ name, slug });
    if (!result.error) {
      await queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      return result.data;
    }

    const failure = new Error(result.error.message || "Could not create workspace");
    if (!isWorkspaceSlugCollisionError(failure)) throw failure;
    slug = createUniqueWorkspaceSlug(name, [...usedSlugs, slug], Crypto.randomUUID);
  }

  throw new Error("Could not create workspace after slug collision retries");
}
