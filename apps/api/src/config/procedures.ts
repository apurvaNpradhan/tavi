import { openapi } from "@orpc/openapi";
import { isEmailConfigured } from "@tavi/email";
import { env } from "@tavi/env/server";
import { publicProcedure } from "../orpc/base";
import { runtimeConfigSchema } from "./schemas";

/** Returns public runtime feature flags without exposing credentials. */
const getRuntimeConfig = publicProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/config",
      operationId: "getRuntimeConfig",
      tags: ["Config"],
      summary: "Get runtime configuration",
      description: "Non-sensitive feature flags for the client.",
      successDescription: "The runtime configuration",
      spec: (operation) => ({ ...operation, security: [] }),
    }),
  )
  .output(runtimeConfigSchema)
  .handler(async () => ({
    appName: env.TAVI_APP_NAME,
    registrationEnabled: env.DISABLE_REGISTRATION !== "true",
    guestAccessEnabled: env.DISABLE_GUEST_ACCESS !== "true",
    workspaceCreationEnabled: env.DISABLE_WORKSPACE_CREATION !== "true",
    magicLinkEnabled: isEmailConfigured() && env.DISABLE_LOGIN_FORM !== "true",
    emailOtpEnabled:
      isEmailConfigured() &&
      env.DISABLE_LOGIN_FORM !== "true" &&
      env.DISABLE_EMAIL_OTP_SIGN_IN !== "true",
    socialProviders: {
      github: Boolean(env.GITHUB_CLIENT_ID),
      google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      custom: Boolean(env.CUSTOM_OAUTH_CLIENT_ID),
    },
  }));

/** The config feature's procedures, mounted under `router.config`. */
export const configRouter = {
  get: getRuntimeConfig,
};
