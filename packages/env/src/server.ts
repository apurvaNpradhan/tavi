import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

// Load `apps/api/.env` (or whatever directory the process runs from) once,
// before validation reads `process.env`. `quiet` keeps containers with no env
// file from printing a "missing .env" tip on every boot.
config({ quiet: true });

/** A boolean flag: absent means off, only the literal "true" turns it on. */
const flag = z.enum(["true", "false"]).optional();

/**
 * Server-side configuration for the API and email packages.
 *
 * Everything is validated and coerced once at import and snapshotted into
 * `env`; empty strings count as unset. `NODE_ENV`, URLs and ports get sensible
 * development defaults, so nothing here is hard-required at import time —
 * subsystems that must fail a boot keep their own checks (database derivation
 * and `AUTH_SECRET` in production stay in their domain modules so development
 * can still generate a fallback secret).
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(1337),

    // Application URLs.
    TAVI_API_URL: z.url().default("http://localhost:1337"),
    TAVI_CLIENT_URL: z.url().default("http://localhost:5173"),
    TAVI_APP_NAME: z.string().default("Tavi"),
    CORS_ORIGINS: z.string().optional(),

    // Database: either DATABASE_URL directly, or a URL derived from POSTGRES_*
    // (see `resolve-database-url.ts` for when derivation kicks in).
    DATABASE_URL: z.string().optional(),
    POSTGRES_DB: z.string().optional(),
    POSTGRES_USER: z.string().optional(),
    POSTGRES_PASSWORD: z.string().optional(),
    POSTGRES_HOST: z.string().optional(),
    POSTGRES_PORT: z.string().optional(),

    // Authentication. AUTH_SECRET is intentionally optional here: development
    // generates and persists a fallback, and production enforcement lives in
    // `resolveAuthSecret()` so the two behaviours can differ.
    AUTH_SECRET: z.string().optional(),
    COOKIE_DOMAIN: z.string().optional(),
    DEVICE_AUTH_CLIENT_IDS: z.string().optional(),

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    CUSTOM_OAUTH_CLIENT_ID: z.string().optional(),
    CUSTOM_OAUTH_CLIENT_SECRET: z.string().optional(),
    CUSTOM_OAUTH_AUTHORIZATION_URL: z.url().optional(),
    CUSTOM_OAUTH_TOKEN_URL: z.url().optional(),
    CUSTOM_OAUTH_USER_INFO_URL: z.url().optional(),
    CUSTOM_OAUTH_DISCOVERY_URL: z.url().optional(),
    CUSTOM_OAUTH_SCOPES: z.string().optional(),
    CUSTOM_OAUTH_RESPONSE_TYPE: z.string().optional(),
    CUSTOM_AUTH_PKCE: flag,

    // Feature switches.
    DISABLE_REGISTRATION: flag,
    DISABLE_LOGIN_FORM: flag,
    DISABLE_EMAIL_OTP_SIGN_IN: flag,
    DISABLE_WORKSPACE_CREATION: flag,
    DISABLE_GUEST_ACCESS: flag,

    // Email. Optional as a whole: `getResendConfig()` returns null unless the
    // API key and from-address are set, so mail-less instances still boot.
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().optional(),

    // Observability. Reporting stays opt-in: nothing initializes without a DSN.
    SENTRY_DSN: z.string().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),
    SENTRY_RELEASE: z.string().optional(),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
    SENTRY_PROFILES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
