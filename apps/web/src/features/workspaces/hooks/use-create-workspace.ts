import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUniqueWorkspaceSlug, isWorkspaceSlugCollisionError } from "@tavi/libs";
import { authClient } from "@/shared/auth/auth-client";

export type CreateWorkspaceRequest = {
  name: string;
};

/** Bounded retries so a persistent collision cannot spin forever. */
const SLUG_ATTEMPTS = 5;

/**
 * Creates a workspace for the signed-in user.
 *
 * Better Auth's organization plugin requires a unique slug, which the caller
 * does not supply. The slug is derived from the name and, on a collision, the
 * request is retried with a fresh random suffix instead of failing in front of
 * the user.
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: CreateWorkspaceRequest) => {
      const listed = await authClient.organization.list();
      const takenSlugs = (listed.data ?? []).map((workspace) => workspace.slug);
      let slug = createUniqueWorkspaceSlug(name, takenSlugs);

      for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt += 1) {
        const { data, error } = await authClient.organization.create({
          name,
          slug,
        });

        if (!error) {
          return data;
        }

        const createError = new Error(error.message || "Failed to create workspace");

        if (!isWorkspaceSlugCollisionError(createError)) {
          throw createError;
        }

        slug = createUniqueWorkspaceSlug(name, [...takenSlugs, slug]);
      }

      throw new Error("Failed to create workspace");
    },
    // The dashboard sidebar reads this key; invalidating here keeps the cache
    // contract in the hook rather than in each caller.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export default useCreateWorkspace;
