import { apiKey } from "@better-auth/api-key";
import {
  DELETE_ACCOUNT_TOKEN_EXPIRY_SECONDS,
  isEmailConfigured,
  OTP_EXPIRY_SECONDS,
  sendDeleteAccountEmail,
  sendMagicLinkEmail,
  sendOtpEmail,
  sendWorkspaceInvitationEmail,
} from "@tavi/email";
import { env } from "@tavi/env/server";
import { ac, owner } from "@tavi/permissions";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import {
  admin as adminPlugin,
  anonymous,
  bearer,
  deviceAuthorization,
  emailOTP,
  genericOAuth,
  lastLoginMethod,
  magicLink,
  openAPI,
  organization,
} from "better-auth/plugins";
import type { AccessControl } from "better-auth/plugins/access";
import type { UserWithAnonymous } from "better-auth/plugins/anonymous";
import { expo } from "@better-auth/expo";
import { eq } from "drizzle-orm";
import db, { schema } from "./database";
import deleteAccountData from "./user/operations/delete-account-data";
import { FIRST_ONBOARDING_STEP } from "./user/onboarding";
import { resolveAuthSecret } from "./utils/auth-secret";
import { getTrustedAuthOrigins } from "./utils/trusted-origins";
import { mapCustomOAuthProfileToUser } from "./utils/custom-oauth-profile";
import { generateDemoName } from "./utils/generate-demo-name";
import { getDefaultCookieAttributes } from "./utils/get-default-cookie-attributes";
import { promoteInitialAdministrator } from "./utils/instance-bootstrap";
import { isLocalSignInPath } from "./utils/is-local-sign-in-path";
import { assertUserRegistrationAllowed } from "./utils/registration-policy";
import { completeWorkspaceCreationLifecycle } from "./workspace/workspace-lifecycle";
import { publishEvent } from "./events";

const apiUrl = env.TAVI_API_URL;
const clientUrl = env.TAVI_CLIENT_URL;

const disableLoginForm = env.DISABLE_LOGIN_FORM === "true";
const disableEmailOtpSignIn = env.DISABLE_EMAIL_OTP_SIGN_IN === "true";
const disableWorkspaceCreation = env.DISABLE_WORKSPACE_CREATION === "true";

/**
 * Every endpoint that could sign in with, mint, or change a password.
 *
 * This template has no password sign-in, so these are refused outright rather
 * than relying on `emailAndPassword` being unconfigured: the email-OTP plugin
 * registers a password-reset pair regardless of that option, and a future
 * change that re-enabled `emailAndPassword` should not silently reopen the
 * rest. The credential routes are the ones that would write to
 * `account.password`.
 */
const retiredPasswordPaths = new Set([
  "/sign-in/email",
  "/sign-in/username",
  "/sign-up/email",
  "/change-password",
  "/request-password-reset",
  "/reset-password",
  "/admin/set-user-password",
  "/email-otp/request-password-reset",
  "/email-otp/reset-password",
  "/forget-password/email-otp",
]);

/** Origins allowed to carry credentials. */
const trustedOrigins = getTrustedAuthOrigins({
  clientUrl,
  apiUrl,
  isProduction: env.NODE_ENV === "production",
});

const baseURL = (() => {
  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return apiUrl;
  }
})();

const authSecret = (() => {
  try {
    return resolveAuthSecret();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
})();

async function getUserLocale(email: string): Promise<string | null> {
  const [user] = await db
    .select({ locale: schema.userTable.locale })
    .from(schema.userTable)
    .where(eq(schema.userTable.email, email))
    .limit(1);

  return user?.locale ?? null;
}

function getDeviceAuthClientIds(): Set<string> {
  const raw = env.DEVICE_AUTH_CLIENT_IDS?.trim();
  if (raw) {
    return new Set(
      raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );
  }
  return new Set(["callus-cli"]);
}

const deviceVerificationUri = `${clientUrl.replace(/\/$/, "")}/device`;

export const auth = betterAuth({
  baseURL,
  trustedOrigins,
  secret: authSecret,
  basePath: "/api/auth",

  // Model names must match the Better Auth plugin expectations; the tables are
  // named for this domain and mapped here.
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.userTable,
      account: schema.accountTable,
      session: schema.sessionTable,
      verification: schema.verificationTable,
      organization: schema.workspaceTable,
      workspace: schema.workspaceTable,
      member: schema.workspaceUserTable,
      workspace_member: schema.workspaceUserTable,
      invitation: schema.invitationTable,
      organizationRole: schema.workspaceRoleTable,
      workspace_role: schema.workspaceRoleTable,
      team: schema.teamTable,
      teamMember: schema.teamMemberTable,
      apikey: schema.apikeyTable,
      deviceCode: schema.deviceCodeTable,
      userAvatar: schema.userAvatarTable,
    },
  }),

  user: {
    additionalFields: {
      locale: { type: "string", input: true, required: false },
      // First-run setup progress. Client-writable because the profile step is a
      // profile edit; it gates routing only, never authorization, so a client
      // setting it early skips a form rather than gaining access to anything.
      // Better Auth has no enum field type, so `user/onboarding.ts` validates
      // the value on write.
      onboardingStep: {
        type: "string",
        required: true,
        defaultValue: FIRST_ONBOARDING_STEP,
        input: true,
      },
    },
    deleteUser: {
      enabled: true,
      // Deletion is confirmed through a link mailed to the account's address,
      // never a credential. No account here has a password, and a
      // fresh-session requirement would stop working after a day; proving
      // control of the inbox covers both without either.
      deleteTokenExpiresIn: DELETE_ACCOUNT_TOKEN_EXPIRY_SECONDS,
      sendDeleteAccountVerification: async ({ user, url }) => {
        const locale = await getUserLocale(user.email);
        // A delivery failure is logged inside `sendEmail` and then swallowed by
        // Better Auth's background runner, so the caller cannot tell it apart
        // from success. The `/delete-user` guard in `hooks.before` still blocks
        // the case where email is not configured at all.
        await sendDeleteAccountEmail(user.email, "Confirm account deletion", {
          deleteLink: url,
          userName: user.name,
          locale,
        });
      },
      // Cascades are not enough: avatars live in a separate table,
      // solely-owned workspaces must not be orphaned, and uploads never linked
      // to a resource would still consume storage.
      beforeDelete: async (user) => {
        await deleteAccountData(user.id);
      },
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      // Only link to an existing local account once its email is verified.
      // Without this, an attacker could pre-register a victim's address and
      // retain access after the victim signs in through a trusted provider.
      requireLocalEmailVerified: true,
    },
  },

  // No `emailAndPassword`: every sign-in method in this template is
  // passwordless (magic link, email OTP, social/OIDC, guest, device flow,
  // API keys). There is deliberately no password hasher configured, so no code
  // path can turn a secret into a stored credential.

  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID || "",
      clientSecret: env.GITHUB_CLIENT_SECRET || "",
      scope: ["user:email"],
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  plugins: [
    // Guest accounts let someone try the app before signing up.
    ...(env.DISABLE_GUEST_ACCESS !== "true"
      ? [
          anonymous({
            generateName: async () => generateDemoName(),
            emailDomainName: "tavi.local",
          }),
        ]
      : []),
    lastLoginMethod(),
    expo(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const delivery = await sendMagicLinkEmail(email, "Your sign-in link", {
          magicLink: url,
        });
        if (!delivery.success) {
          throw new APIError("SERVICE_UNAVAILABLE", {
            message: "Sign-in link delivery failed. Try again shortly.",
          });
        }
      },
    }),
    ...(disableEmailOtpSignIn
      ? []
      : [
          emailOTP({
            expiresIn: OTP_EXPIRY_SECONDS,
            async sendVerificationOTP({ email, otp, type }) {
              if (type === "sign-in") {
                await sendOtpEmail(email, "Your verification code", { otp });
              }
            },
          }),
        ]),
    organization({
      // SAFETY: `createAccessControl` infers a `newRole` signature specialized to
      // our narrower `statement` shape, which is not assignable to better-auth's
      // looser generic `AccessControl`. The runtime object is compatible — only
      // the inferred generic differs — and every permission check still goes
      // through this same `ac` value, so the widening cannot change behaviour.
      ac: ac as AccessControl,
      // Only `owner` is static, so the creator can never be locked out.
      // viewer/member/admin are seeded per workspace as editable rows.
      roles: { owner },
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: 25,
      },
      teams: { enabled: true, maximumTeams: 10, allowRemovingAllTeams: false },
      schema: {
        organization: {
          modelName: "workspace",
          additionalFields: {
            description: { type: "string", input: true, required: false },
          },
        },
        member: {
          modelName: "workspace_member",
          fields: { organizationId: "workspaceId", createdAt: "joinedAt" },
        },
        invitation: {
          modelName: "invitation",
          fields: { organizationId: "workspaceId" },
        },
        organizationRole: {
          modelName: "workspace_role",
          fields: { organizationId: "workspaceId" },
        },
        team: {
          modelName: "team",
          fields: { organizationId: "workspaceId" },
        },
      },
      allowUserToCreateOrganization: disableWorkspaceCreation
        ? async (user) => {
            // Read the live role: a session snapshot can predate first-user
            // promotion or an administrator's later change.
            const [fresh] = await db
              .select({ role: schema.userTable.role })
              .from(schema.userTable)
              .where(eq(schema.userTable.id, user.id));
            return fresh?.role === "admin";
          }
        : true,
      // The invitation id is the secret here; requiring a verified email would
      // break invitation acceptance on instances that do not verify emails.
      requireEmailVerificationOnInvitation: false,
      organizationHooks: {
        afterCreateOrganization: async ({ organization: workspace, user }) => {
          await completeWorkspaceCreationLifecycle({
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            creatorUserId: user.id,
          });
        },
        afterAcceptInvitation: async ({ invitation, user }) => {
          // This runs after Better Auth commits acceptance. The notification
          // itself is written by a database trigger with the membership, so a
          // process loss here cannot lose that durable side effect. In-process
          // subscribers remain best-effort and must not turn a committed
          // acceptance into a failed response that cannot be retried.
          try {
            await publishEvent(
              "invitation.accepted",
              {
                invitationId: invitation.id,
                inviterId: invitation.inviterId,
                acceptedUserId: user.id,
                workspaceId: invitation.organizationId,
              },
              { waitForHandlers: true },
            );
          } catch (error) {
            console.error("Error processing event invitation.accepted:", error);
          }
        },
      },
      async sendInvitationEmail(data) {
        const invitationLink = `${clientUrl}/invitation/accept/${data.id}`;
        await sendWorkspaceInvitationEmail(data.email, `Join ${data.organization.name}`, {
          inviterName: data.inviter.user.name,
          workspaceName: data.organization.name,
          invitationLink,
        });
      },
    }),
    genericOAuth({
      config: [
        {
          providerId: "custom",
          clientId: env.CUSTOM_OAUTH_CLIENT_ID || "",
          clientSecret: env.CUSTOM_OAUTH_CLIENT_SECRET,
          authorizationUrl: env.CUSTOM_OAUTH_AUTHORIZATION_URL || "",
          tokenUrl: env.CUSTOM_OAUTH_TOKEN_URL || "",
          userInfoUrl: env.CUSTOM_OAUTH_USER_INFO_URL || "",
          scopes: env.CUSTOM_OAUTH_SCOPES?.split(",")
            .map((scope) => scope.trim())
            .filter(Boolean) ?? ["profile", "email"],
          responseType: env.CUSTOM_OAUTH_RESPONSE_TYPE || "code",
          discoveryUrl: env.CUSTOM_OAUTH_DISCOVERY_URL || "",
          pkce: env.CUSTOM_AUTH_PKCE !== "false",
          mapProfileToUser: mapCustomOAuthProfileToUser,
        },
      ],
    }),
    bearer(),
    apiKey({
      enableSessionForAPIKeys: true,
      apiKeyHeaders: "x-api-key",
      rateLimit: { enabled: true, maxRequests: 100, timeWindow: 60 * 1000 },
    }),
    deviceAuthorization({
      verificationUri: deviceVerificationUri,
      validateClient: async (clientId) => getDeviceAuthClientIds().has(clientId),
    }),
    adminPlugin({ defaultRole: "user", adminRoles: ["admin"] }),
    openAPI(),
  ],

  session: {
    cookieCache: {
      // Consult the session store on every request so revocation — signing out
      // elsewhere, or deleting the account — takes effect immediately.
      enabled: false,
    },
  },

  rateLimit: {
    // Conservative global limits; tightened on the abuse-prone auth paths.
    enabled: env.NODE_ENV === "production",
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/anonymous": { window: 60, max: 3 },
      "/sign-in/magic-link": { window: 60, max: 3 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/sign-in/email-otp": { window: 60, max: 5 },
      "/organization/invite-member": { window: 60, max: 5 },
    },
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // New sessions start on the user's earliest membership so sign-in
          // always lands on an active tenant. Switching workspaces only moves
          // the session that made the switch, so this is re-derived per session.
          const [membership] = await db
            .select({ workspaceId: schema.workspaceUserTable.workspaceId })
            .from(schema.workspaceUserTable)
            .where(eq(schema.workspaceUserTable.userId, session.userId))
            .orderBy(schema.workspaceUserTable.joinedAt)
            .limit(1);

          if (membership) {
            return { data: { ...session, activeOrganizationId: membership.workspaceId } };
          }
        },
      },
    },
    user: {
      create: {
        before: async (user, ctx) => {
          await assertUserRegistrationAllowed(
            user as Partial<UserWithAnonymous> & { email: string },
            {
              path: ctx?.path,
              invitationId: ctx?.body?.invitationId ?? ctx?.headers?.get("x-invitation-id"),
            },
          );
        },
        after: async (user) => {
          // Guests must never become the instance administrator, even on a
          // fresh instance.
          if ((user as Partial<UserWithAnonymous>).isAnonymous) return;
          await promoteInitialAdministrator(user.id);
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (disableLoginForm && isLocalSignInPath(ctx.path)) {
        throw new APIError("FORBIDDEN", {
          message: "Local sign-in is disabled. Use a configured social or OIDC sign-in method.",
        });
      }

      if (retiredPasswordPaths.has(ctx.path)) {
        throw new APIError("FORBIDDEN", {
          message: "Password sign-in is not available. Use a passwordless sign-in method.",
        });
      }

      if (
        (ctx.path === "/sign-in/magic-link" || ctx.path === "/email-otp/send-verification-otp") &&
        !isEmailConfigured()
      ) {
        throw new APIError("SERVICE_UNAVAILABLE", {
          message: "Email sign-in is unavailable on this instance.",
        });
      }

      if (ctx.path === "/delete-user" && !isEmailConfigured()) {
        throw new APIError("SERVICE_UNAVAILABLE", {
          message: "Account deletion requires email delivery to be configured.",
        });
      }
    }),
  },

  advanced: {
    ipAddress: {
      // Set only by the Node transport middleware, never trusted from clients.
      ipAddressHeaders: ["x-tavi-client-ip"],
      trustedProxies: [],
    },
    defaultCookieAttributes: getDefaultCookieAttributes({
      apiUrl,
      clientUrl,
      cookieDomain: env.COOKIE_DOMAIN,
    }),
  },
});
