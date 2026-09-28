/** Converts a workspace display name into a URL-safe slug fragment. */
export function createWorkspaceBaseSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "workspace"
  );
}

/** Returns a readable workspace slug, adding a random suffix only on collision. */
export function createUniqueWorkspaceSlug(
  value: string,
  existingSlugs: Iterable<string | null | undefined>,
  randomUUID: () => string = () => globalThis.crypto.randomUUID(),
): string {
  const baseSlug = createWorkspaceBaseSlug(value);
  const usedSlugs = new Set(
    Array.from(existingSlugs, (slug) => slug?.toLowerCase()).filter(Boolean),
  );
  if (!usedSlugs.has(baseSlug.toLowerCase())) return baseSlug;

  let slug = `${baseSlug}-${createWorkspaceSlugSuffix(randomUUID)}`;
  while (usedSlugs.has(slug.toLowerCase())) {
    slug = `${baseSlug}-${createWorkspaceSlugSuffix(randomUUID)}`;
  }
  return slug;
}

/** Identifies Better Auth workspace-creation errors worth retrying with a new slug. */
export function isWorkspaceSlugCollisionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    /\b(?:organization|workspace)(?:\s+slug)?\s+already exists\b/.test(message) ||
    /\bslug\b.*\b(?:already exists|already taken|duplicate|unique)\b/.test(message)
  );
}

function createWorkspaceSlugSuffix(randomUUID: () => string): string {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}
