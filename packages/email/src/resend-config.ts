import { env } from "@tavi/env/server";

export type ResendConfig = {
  apiKey: string;
  from: string;
};

/** The env surface `getResendConfig` reads, named so it can be tested directly. */
export type ResendEnvSource = {
  RESEND_API_KEY?: string | undefined;
  RESEND_FROM_EMAIL?: string | undefined;
};

/**
 * Pure resolver behind `getResendConfig`.
 *
 * Email is optional: a self-hosted instance without an API key still works, it
 * just cannot send invitations or password resets. Callers check
 * `isEmailConfigured()` first so they can tell the user why a message was not
 * sent instead of throwing.
 */
export function resolveResendConfig(source: ResendEnvSource): ResendConfig | null {
  const apiKey = source.RESEND_API_KEY?.trim();
  const from = source.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) return null;

  return { apiKey, from };
}

export function getResendConfig(): ResendConfig | null {
  return resolveResendConfig(env);
}

export function isEmailConfigured(): boolean {
  return getResendConfig() !== null;
}
