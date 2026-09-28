import { env } from "@tavi/env/server";
import { eq } from "drizzle-orm";
import db, { schema } from "../database";
import { hasPendingInvitationForEmail } from "./registration-policy";

export type RegistrationCheck = { allowed: true } | { allowed: false; reason: string };

/**
 * Whether a signup attempt is permitted.
 *
 * Unlike `assertUserRegistrationAllowed` this returns a verdict instead of
 * throwing, for use on public endpoints that render the answer (e.g. the
 * invitation acceptance screen).
 */
export async function checkRegistrationAllowed(
  email: unknown,
  invitationId?: string | null,
  registrationDisabled = env.DISABLE_REGISTRATION === "true",
): Promise<RegistrationCheck> {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return { allowed: false, reason: "An email address is required." };
  }

  if (!registrationDisabled) return { allowed: true };

  const { hasRegisteredUsers } = await import("./instance-bootstrap");
  if (!(await hasRegisteredUsers())) {
    return { allowed: true };
  }

  if (await hasPendingInvitationForEmail(normalizedEmail, invitationId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Registration is currently disabled. Ask a workspace administrator for an invitation.",
  };
}

export type InvitationDetails = {
  id: string;
  email: string;
  workspaceName: string;
  status: string;
  expiresAt: Date;
};

/** Public invitation lookup for the acceptance screen (no session required). */
export async function getInvitationDetails(id: string): Promise<InvitationDetails | null> {
  const [row] = await db
    .select({
      id: schema.invitationTable.id,
      email: schema.invitationTable.email,
      status: schema.invitationTable.status,
      expiresAt: schema.invitationTable.expiresAt,
      workspaceName: schema.workspaceTable.name,
    })
    .from(schema.invitationTable)
    .innerJoin(
      schema.workspaceTable,
      eq(schema.invitationTable.workspaceId, schema.workspaceTable.id),
    )
    .where(eq(schema.invitationTable.id, id))
    .limit(1);

  return row ?? null;
}
