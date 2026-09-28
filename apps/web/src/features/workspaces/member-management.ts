/** Pending invitations are visible to people who can create or cancel them. */
export function canViewPendingInvitations(
  capabilitiesReady: boolean,
  canCreate: boolean,
  canCancel: boolean,
): boolean {
  return capabilitiesReady && (canCreate || canCancel);
}

/** Keep the current assignment selectable while offering current workspace roles. */
export function memberRoleOptions(roles: readonly string[], currentRole?: string): string[] {
  return [
    ...new Set(
      [...roles.filter((role) => role !== "owner"), currentRole].filter((role): role is string =>
        Boolean(role),
      ),
    ),
  ];
}
