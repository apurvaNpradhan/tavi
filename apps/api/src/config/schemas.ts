import { z } from "zod";

/** Non-sensitive feature flags available before a user has signed in. */
export const runtimeConfigSchema = z
  .object({
    appName: z.string(),
    registrationEnabled: z.boolean(),
    guestAccessEnabled: z.boolean(),
    workspaceCreationEnabled: z.boolean(),
    magicLinkEnabled: z.boolean(),
    emailOtpEnabled: z.boolean(),
    socialProviders: z.object({ github: z.boolean(), google: z.boolean(), custom: z.boolean() }),
  })
  .meta({ id: "RuntimeConfig" });
