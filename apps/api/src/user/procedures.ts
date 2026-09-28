import { openapi } from "@orpc/openapi";
import { z } from "zod";
import { authedProcedure } from "../orpc/base";
import { MAX_AVATAR_BYTES, MAX_AVATAR_DATA_LENGTH } from "./avatar";
import deleteAvatar from "./operations/delete-avatar";
import getCurrentUser from "./operations/get-current-user";
import saveAvatar from "./operations/save-avatar";
import { avatarDeletedSchema, currentUserSchema, savedAvatarSchema } from "./output";

/**
 * Avatar upload body.
 *
 * Base64 rather than multipart: the browser has already decoded, cropped and
 * re-encoded the image, so it holds a Blob it must read anyway, and a JSON body
 * keeps this a plain validated procedure instead of a hand-rolled `File` check.
 * The length cap rejects an oversized payload before it is buffered.
 */
export const uploadAvatarBody = z.object({
  contentType: z
    .string()
    .describe("One of image/png, image/jpeg or image/webp.")
    .meta({ example: "image/png" }),
  data: z
    .string()
    .max(MAX_AVATAR_DATA_LENGTH)
    .describe("Base64 encoded image bytes, optionally with a data: URL prefix."),
});

export const getCurrentUserProcedure = authedProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/user/me",
      operationId: "getCurrentUser",
      tags: ["User"],
      summary: "Get current user",
      description:
        "The authenticated user's profile, read fresh from the database so an administrator's role change is reflected immediately.",
      successDescription: "The current user",
    }),
  )
  .errors({ NOT_FOUND: { message: "User not found" } })
  .output(currentUserSchema)
  .handler(async ({ context }) => getCurrentUser(context.userId));

export const uploadAvatar = authedProcedure
  .meta(
    openapi({
      method: "POST",
      path: "/user/avatar",
      operationId: "uploadAvatar",
      tags: ["User"],
      summary: "Upload avatar",
      description: `Store a base64 encoded avatar (PNG, JPEG or WebP, up to ${Math.floor(
        MAX_AVATAR_BYTES / 1024,
      )}KB) and point the profile's image at it. Replacing an avatar changes its public URL.`,
      successDescription: "The stored avatar",
    }),
  )
  .errors({
    BAD_REQUEST: { message: "Unsupported image type, malformed base64, or too large" },
  })
  .input(uploadAvatarBody)
  .output(savedAvatarSchema)
  .handler(async ({ input, context }) =>
    saveAvatar({ userId: context.userId, contentType: input.contentType, data: input.data }),
  );

export const deleteAvatarProcedure = authedProcedure
  .meta(
    openapi({
      method: "DELETE",
      path: "/user/avatar",
      operationId: "deleteAvatar",
      tags: ["User"],
      summary: "Delete avatar",
      description:
        "Remove the stored avatar and clear the profile's image. Succeeds even when there was nothing to remove.",
      successDescription: "Whether an avatar was removed",
    }),
  )
  .output(avatarDeletedSchema)
  .handler(async ({ context }) => deleteAvatar(context.userId));

/** The user feature's procedures, mounted under `router.user`. */
export const userRouter = {
  getCurrentUser: getCurrentUserProcedure,
  uploadAvatar,
  deleteAvatar: deleteAvatarProcedure,
};
