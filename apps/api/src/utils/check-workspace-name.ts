const MIN_LENGTH = 2;
const MAX_LENGTH = 48;

export type WorkspaceNameCheck = { ok: true } | { ok: false; reason: string };

/**
 * Validates a workspace name before Better Auth creates the organization, so
 * the caller sees a useful message instead of a database constraint violation.
 */
export function checkWorkspaceName(name: string): WorkspaceNameCheck {
  const trimmed = name.trim();

  if (trimmed.length < MIN_LENGTH) {
    return {
      ok: false,
      reason: `Workspace name must be at least ${MIN_LENGTH} characters.`,
    };
  }

  if (trimmed.length > MAX_LENGTH) {
    return {
      ok: false,
      reason: `Workspace name must be at most ${MAX_LENGTH} characters.`,
    };
  }

  return { ok: true };
}
