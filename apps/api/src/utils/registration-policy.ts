import { APIError } from "better-auth/api";
import { and, eq, gt } from "drizzle-orm";
import { env } from "@tavi/env/server";
import db, { schema } from "../database";

/**
 * Decides who may create an account.
 *
 * Two escape hatches keep a locked-down instance usable:
 *  - the very first signup always succeeds, so an operator can bootstrap an
 *    administrator before closing registration;
 *  - a valid pending, unexpired invitation for the exact email always
 *    succeeds, so invited teammates can join without reopening public signup.
 */
const registrationDisabled = () => env.DISABLE_REGISTRATION === "true";

const guestAccessDisabled = () => env.DISABLE_GUEST_ACCESS === "true";

export function normalizeInvitationId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Invitation rows are stored lowercased (Better Auth's organization adapter
 * normalizes them on insert), but signup emails arrive from callers that may
 * not, so compare on a lowercased copy of both sides.
 */
function normalizeInvitationEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Whether an invitation lets this exact email through a closed instance.
 *
 * Both the ID lookup and the email lookup require the normalized signup email,
 * a `pending` status, and an unexpired `expiresAt`. The ID check alone is not
 * enough: the invitation ID is a bearer secret, so without the email predicate
 * it would let whoever holds one ID register an unrelated address while
 * registration is closed. Expiry is likewise checked on both paths — a pending
 * row past its `expiresAt` must not be a way in.
 */
export async function hasPendingInvitationForEmail(
  email: string,
  invitationId?: string | null,
): Promise<boolean> {
  const normalizedEmail = normalizeInvitationEmail(email);
  if (!normalizedEmail) return false;

  const pendingAndUnexpired = and(
    eq(schema.invitationTable.status, "pending"),
    gt(schema.invitationTable.expiresAt, new Date()),
  );

  if (invitationId) {
    const [byId] = await db
      .select({ id: schema.invitationTable.id })
      .from(schema.invitationTable)
      .where(
        and(
          eq(schema.invitationTable.id, invitationId),
          eq(schema.invitationTable.email, normalizedEmail),
          pendingAndUnexpired,
        ),
      )
      .limit(1);

    if (byId) return true;
  }

  const [byEmail] = await db
    .select({ id: schema.invitationTable.id })
    .from(schema.invitationTable)
    .where(and(eq(schema.invitationTable.email, normalizedEmail), pendingAndUnexpired))
    .limit(1);

  return Boolean(byEmail);
}

/**
 * Throws when a user creation must be refused. Invoked from the Better Auth
 * `user.create.before` hook, so the rejection happens before any row is written.
 */
export async function assertUserRegistrationAllowed(
  user: { email?: string | null; isAnonymous?: boolean | null },
  context: { path?: string; invitationId?: string | null },
): Promise<void> {
  if (!registrationDisabled()) return;

  const { isFirstUser } = await import("./instance-bootstrap").then(async (module) => ({
    isFirstUser: !(await module.hasRegisteredUsers()),
  }));

  if (isFirstUser) return;

  if (user.isAnonymous) {
    throw new APIError("FORBIDDEN", {
      message: "Guest access is not available on this instance.",
    });
  }

  const email = user.email?.trim();
  if (!email) {
    throw new APIError("FORBIDDEN", {
      message: "Registration is currently disabled.",
    });
  }

  const invited = await hasPendingInvitationForEmail(email, context.invitationId ?? null);

  if (!invited) {
    throw new APIError("FORBIDDEN", {
      message:
        "Registration is currently disabled. Ask a workspace administrator for an invitation.",
    });
  }
}

export async function assertGuestRegistrationAllowed(): Promise<void> {
  if (!guestAccessDisabled()) return;
  throw new APIError("FORBIDDEN", {
    message: "Guest access is disabled on this instance.",
  });
}
