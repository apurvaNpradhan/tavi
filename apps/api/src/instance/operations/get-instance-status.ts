import { hasAdministrator, hasRegisteredUsers } from "../../utils/instance-bootstrap";

/**
 * Public setup status.
 *
 * The sign-in screen uses this to decide whether to show a "create the first
 * account" call to action. It exposes only booleans, never counts or identities.
 */
async function getInstanceStatus(): Promise<{
  hasUsers: boolean;
  hasAdmin: boolean;
}> {
  const [hasUsers, hasAdmin] = await Promise.all([hasRegisteredUsers(), hasAdministrator()]);

  return { hasUsers, hasAdmin };
}

export default getInstanceStatus;
