import { apiKeyClient } from "@better-auth/api-key/client";
import { ac, admin, member, owner, viewer } from "@tavi/permissions";
import {
  adminClient,
  anonymousClient,
  deviceAuthorizationClient,
  emailOTPClient,
  genericOAuthClient,
  inferAdditionalFields,
  lastLoginMethodClient,
  magicLinkClient,
  organizationClient,
} from "better-auth/client/plugins";
import type { AccessControl } from "better-auth/plugins/access";
import { createAuthClient } from "better-auth/react";
import { apiOrigin } from "@/shared/api/api-client";

/**
 * Better Auth's browser client.
 *
 * This plugin list must mirror `apps/api/src/auth.ts`. When the two diverge,
 * a plugin's endpoints exist on the server but are uncallable (or untyped) on
 * the client — so keep the two files in sync when either changes.
 */
export const authClient = createAuthClient({
  // Without this the client posts to the page origin. That resolves in the
  // bundled image (nginx proxies `/api` to the API), but in dev the Vite server
  // owns that origin and answers 404.
  baseURL: apiOrigin(),
  basePath: "/api/auth",
  plugins: [
    anonymousClient(),
    lastLoginMethodClient(),
    magicLinkClient(),
    emailOTPClient(),
    organizationClient({
      // SAFETY: `ac` is created from our narrower `statement` map, so its
      // inferred `newRole` generic does not match better-auth's looser
      // `AccessControl`. Only the generic differs; the runtime roles below are
      // the same objects the server enforces.
      ac: ac as AccessControl,
      roles: { viewer, member, admin, owner },
      dynamicAccessControl: { enabled: true },
      // Mirrors the server's organization `additionalFields` so `description`
      // is typed on `organization.create` instead of needing a cast.
      schema: {
        organization: {
          additionalFields: {
            description: { type: "string", required: false, input: true },
          },
        },
      },
    }),
    genericOAuthClient(),
    deviceAuthorizationClient(),
    apiKeyClient(),
    adminClient(),
    inferAdditionalFields({
      user: {
        locale: { type: "string", required: false, input: true },
        // Mirrors the server's `additionalFields`. Declared `required` because
        // the column has a default, so a session always carries it; the value is
        // still narrowed with `toOnboardingStep` before the router branches on
        // it, since an unknown step must not leave a route with no destination.
        onboardingStep: { type: "string", required: true, input: true },
      },
    }),
  ],
});

export const { useSession } = authClient;
