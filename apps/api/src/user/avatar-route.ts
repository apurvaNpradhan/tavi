import type { OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { ApiHonoEnv } from "../api-context";
import db, { schema } from "../database";
import { createRoute, z } from "../openapi";

/**
 * Registers the public avatar download route.
 *
 * Kept on raw Hono rather than oRPC because the response is a binary body with
 * ETag and conditional-request handling; the operation is still registered with
 * the OpenAPI registry so it appears in the generated document.
 */
export function registerUserAvatarRoute(api: OpenAPIHono<ApiHonoEnv>) {
  api.openapi(
    createRoute({
      method: "get",
      operationId: "getAvatar",
      path: "/user/avatar/{id}",
      tags: ["User"],
      summary: "Download avatar",
      description:
        "Download an avatar by its id. Public and immutable: the id changes whenever the avatar is replaced, so the response can be cached indefinitely.",
      security: [],
      request: { params: z.object({ id: z.string() }) },
      responses: {
        200: {
          description: "The avatar image",
          content: {
            "image/*": { schema: { type: "string", format: "binary" } },
          },
        },
        304: { description: "Not modified" },
        404: { description: "Avatar not found" },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");

      const [avatar] = await db
        .select({
          id: schema.userAvatarTable.id,
          data: schema.userAvatarTable.data,
          mimeType: schema.userAvatarTable.mimeType,
          size: schema.userAvatarTable.size,
          updatedAt: schema.userAvatarTable.updatedAt,
        })
        .from(schema.userAvatarTable)
        .where(eq(schema.userAvatarTable.id, id))
        .limit(1);

      if (!avatar) {
        throw new HTTPException(404, { message: "Avatar not found" });
      }

      const etag = `"${avatar.id}"`;
      if (c.req.header("If-None-Match") === etag) {
        return new Response(null, { status: 304, headers: { ETag: etag } });
      }

      return new Response(new Uint8Array(avatar.data) as BodyInit, {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": avatar.size.toString(),
          "Content-Type": avatar.mimeType,
          // Prevents a mislabeled upload from being sniffed as HTML.
          "X-Content-Type-Options": "nosniff",
          ETag: etag,
          "Last-Modified": avatar.updatedAt.toUTCString(),
        },
      });
    },
  );
}
