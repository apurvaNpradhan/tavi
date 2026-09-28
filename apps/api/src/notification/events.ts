import db, { schema } from "../database";
import { subscribeToEvent } from "../events";

let handlersRegistered = false;

/** Registers the idempotent in-process notification projection once per process. */
export function registerNotificationEventHandlers(): void {
  if (handlersRegistered) return;

  subscribeToEvent(
    "invitation.accepted",
    async ({ invitationId, inviterId, acceptedUserId }) => {
      if (inviterId === acceptedUserId) return;

      await db
        .insert(schema.notificationTable)
        .values({
          recipientId: inviterId,
          type: "invitation.accepted",
          invitationId,
        })
        .onConflictDoNothing({
          target: [schema.notificationTable.recipientId, schema.notificationTable.invitationId],
        });
    },
    { propagateErrors: true },
  );

  handlersRegistered = true;
}
