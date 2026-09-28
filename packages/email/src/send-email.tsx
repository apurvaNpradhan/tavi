import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { getResendConfig, type ResendConfig } from "./resend-config";

export type SendResult =
  | { success: true; messageId: string }
  | {
      success: false;
      reason: "EMAIL_NOT_CONFIGURED" | "SEND_FAILED";
      error?: string;
    };

export type EmailPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailResponse =
  | { data: { id: string }; error: null }
  | {
      data: null;
      error: { name: string; message?: string; statusCode?: number | null };
    };

/**
 * The slice of the Resend client `sendEmail` needs.
 *
 * Declaring it structurally (rather than `Pick<Resend, "emails">`) keeps the
 * tests from having to fake the SDK's whole surface.
 */
export type EmailTransport = {
  emails: {
    send(payload: EmailPayload, options?: { idempotencyKey?: string }): Promise<EmailResponse>;
  };
};

export type EmailDependencies = {
  config: ResendConfig | null;
  transport: EmailTransport | null;
};

let client: EmailTransport | undefined;

function defaultDependencies(): EmailDependencies {
  const config = getResendConfig();
  if (!config) return { config: null, transport: null };

  if (!client) {
    client = new Resend(config.apiKey);
  }

  return { config, transport: client };
}

/**
 * Resend error codes (`validation_error`, `rate_limit_exceeded`, …) are stable
 * and contain no credentials or recipient data. Provider *messages* can echo
 * the recipient address, so only the code is ever logged or returned.
 */
function safeErrorName(error: unknown): string {
  if (error !== null && typeof error === "object" && "name" in error) {
    switch (error.name) {
      case "validation_error":
      case "rate_limit_exceeded":
      case "api_error":
      case "authentication_error":
      case "authorization_error":
      case "invalid_idempotent_request":
      case "concurrent_idempotent_requests":
        return error.name;
    }
  }
  return "transport_error";
}

/**
 * Renders and sends one email through Resend.
 *
 * Never throws: callers are usually inside an auth flow where a transport
 * failure must not surface as a failed sign-in or a 500. The result is returned
 * so callers that *do* care (invitations) can report the real reason.
 *
 * The Resend SDK reports API failures in `{ error }` rather than throwing, so
 * both that and a thrown network failure are handled here.
 *
 * `idempotencyKey` is opt-in and must identify a *logical* send a caller may
 * retry. Callers that cannot tell a retry from a user-requested resend (OTP,
 * magic link, password reset) deliberately pass no key: a static key would
 * suppress the second, legitimate email for 24 hours.
 */
export async function sendEmail(
  options: {
    to: string;
    subject: string;
    template: ReactElement;
    idempotencyKey?: string;
  },
  dependencies: EmailDependencies = defaultDependencies(),
): Promise<SendResult> {
  const { config, transport } = dependencies;
  if (!config || !transport) {
    return { success: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  try {
    const [html, text] = await Promise.all([
      render(options.template),
      render(options.template, { plainText: true }),
    ]);

    const { data, error } = await transport.emails.send(
      {
        from: config.from,
        to: options.to,
        subject: options.subject,
        html,
        text,
      },
      options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined,
    );

    if (error) {
      console.error("Failed to send email:", safeErrorName(error));
      return { success: false, reason: "SEND_FAILED", error: safeErrorName(error) };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Failed to send email:", safeErrorName(error));
    return { success: false, reason: "SEND_FAILED", error: safeErrorName(error) };
  }
}

export function resetEmailClient(): void {
  client = undefined;
}
