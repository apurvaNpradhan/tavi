import { z } from "../openapi";
import { ONBOARDING_STEPS } from "./onboarding";

export const savedAvatarSchema = z
  .object({
    id: z.string(),
    url: z.string().describe("Public URL of the stored avatar, served from /api/user/avatar/{id}."),
    size: z.number().int().describe("Decoded size in bytes."),
  })
  .meta({ id: "SavedAvatar" });

/** Inferred shape of `saveAvatar`, so the operation and its contract cannot drift. */
export type SavedAvatar = z.infer<typeof savedAvatarSchema>;

export const avatarDeletedSchema = z
  .object({
    deleted: z.boolean().describe("False when the user had no stored avatar to remove."),
  })
  .meta({ id: "AvatarDeleted" });

/**
 * The onboarding step as it appears in a response.
 *
 * A plain string rather than an enum: the value is validated against
 * `ONBOARDING_STEPS` on write, and an unrecognized stored value is surfaced
 * as-is so a client can fall back instead of failing to parse the response.
 */
export const onboardingStepSchema = z.string().describe(`One of: ${ONBOARDING_STEPS.join(", ")}.`);

export const currentUserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
    locale: z.string().nullable(),
    role: z.string().nullable(),
    isAnonymous: z.boolean().nullable(),
    onboardingStep: onboardingStepSchema,
  })
  .meta({ id: "CurrentUser" });
