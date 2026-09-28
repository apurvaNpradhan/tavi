import { and, count, desc, eq, sql } from "drizzle-orm";
import { openapi } from "@orpc/openapi";
import { z } from "zod";
import db, { schema } from "../database";
import { responseTimestamp } from "../openapi";
import { authedProcedure } from "../orpc/base";

const paginationInput = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const notificationTypeSchema = z.enum(["invitation.accepted"]);

const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  createdAt: responseTimestamp,
  readAt: responseTimestamp.nullable(),
});

const list = authedProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/notifications",
      operationId: "listNotifications",
      tags: ["Notifications"],
      summary: "List notifications",
      description: "Lists the authenticated user's notifications, newest first.",
    }),
  )
  .input(paginationInput)
  .output(
    z.object({
      items: z.array(notificationSchema),
      limit: z.number().int(),
      offset: z.number().int(),
    }),
  )
  .handler(async ({ input, context }) => {
    const items = await db
      .select({
        id: schema.notificationTable.id,
        type: schema.notificationTable.type,
        createdAt: schema.notificationTable.createdAt,
        readAt: schema.notificationTable.readAt,
      })
      .from(schema.notificationTable)
      .where(eq(schema.notificationTable.recipientId, context.userId))
      .orderBy(desc(schema.notificationTable.createdAt), desc(schema.notificationTable.id))
      .limit(input.limit)
      .offset(input.offset);

    return {
      items: items.map((item) => ({
        ...item,
        type: notificationTypeSchema.parse(item.type),
      })),
      limit: input.limit,
      offset: input.offset,
    };
  });

const unreadCount = authedProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/notifications/unread-count",
      operationId: "getUnreadNotificationCount",
      tags: ["Notifications"],
      summary: "Get unread notification count",
      description: "Counts unread notifications for the authenticated user.",
    }),
  )
  .output(z.object({ count: z.number().int() }))
  .handler(async ({ context }) => {
    const [result] = await db
      .select({ count: count() })
      .from(schema.notificationTable)
      .where(
        and(
          eq(schema.notificationTable.recipientId, context.userId),
          sql`${schema.notificationTable.readAt} is null`,
        ),
      );

    return { count: result?.count ?? 0 };
  });

const markRead = authedProcedure
  .meta(
    openapi({
      method: "POST",
      path: "/notifications/{notificationId}/read",
      operationId: "markNotificationRead",
      tags: ["Notifications"],
      summary: "Mark a notification as read",
      description: "Marks one of the authenticated user's notifications as read.",
    }),
  )
  .input(z.object({ notificationId: z.string().min(1) }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input, context }) => {
    const updated = await db
      .update(schema.notificationTable)
      .set({ readAt: sql`coalesce(${schema.notificationTable.readAt}, now())` })
      .where(
        and(
          eq(schema.notificationTable.id, input.notificationId),
          eq(schema.notificationTable.recipientId, context.userId),
        ),
      )
      .returning({ id: schema.notificationTable.id });

    return { success: updated.length > 0 };
  });

const clear = authedProcedure
  .meta(
    openapi({
      method: "DELETE",
      path: "/notifications",
      operationId: "clearNotifications",
      tags: ["Notifications"],
      summary: "Clear notifications",
      description: "Deletes all notifications belonging to the authenticated user.",
    }),
  )
  .output(z.object({ deletedCount: z.number().int() }))
  .handler(async ({ context }) => {
    const deleted = await db
      .delete(schema.notificationTable)
      .where(eq(schema.notificationTable.recipientId, context.userId))
      .returning({ id: schema.notificationTable.id });

    return { deletedCount: deleted.length };
  });

export const notificationRouter = { list, unreadCount, markRead, clear };
