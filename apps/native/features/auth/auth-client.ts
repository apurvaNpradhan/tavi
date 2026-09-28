import { expoClient } from "@better-auth/expo/client";
import {
  emailOTPClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { apiBaseUrl } from "../../shared/runtime-config";

/** Better Auth client for native sign-in and secure session-cookie storage. */
export const authClient = createAuthClient({
  baseURL: apiBaseUrl.replace(/\/api\/?$/, ""),
  basePath: "/api/auth",
  plugins: [
    emailOTPClient(),
    organizationClient(),
    inferAdditionalFields({
      user: {
        locale: { type: "string", required: false, input: true },
        onboardingStep: { type: "string", required: true, input: true },
        role: { type: "string", required: false, input: false },
      },
    }),
    expoClient({
      scheme: "tavi",
      storagePrefix: "tavi",
      storage: SecureStore,
    }),
  ],
});
