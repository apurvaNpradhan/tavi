import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveResendConfig, type ResendConfig } from "./resend-config";
import {
  type EmailDependencies,
  type EmailPayload,
  type EmailResponse,
  resetEmailClient,
  sendEmail,
} from "./send-email";

const config: ResendConfig = {
  apiKey: "re_test_key",
  from: "Acme <noreply@mail.example.com>",
};

const sendMock = vi.fn<
  (payload: EmailPayload, options?: { idempotencyKey?: string }) => Promise<EmailResponse>
>(async () => ({ data: { id: "email_123" }, error: null }));

const transport = { emails: { send: sendMock } };

function dependencies(configOverride: ResendConfig | null = config): EmailDependencies {
  return { config: configOverride, transport };
}

const template = createElement("div", null, "Hello body");

beforeEach(() => {
  resetEmailClient();
  sendMock.mockClear();
  sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });
  // Failures are expected here; keep the suite output readable.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveResendConfig", () => {
  it("requires both the API key and a non-blank from-address", () => {
    expect(resolveResendConfig({})).toBeNull();
    expect(resolveResendConfig({ RESEND_API_KEY: "re_test_key" })).toBeNull();
    expect(
      resolveResendConfig({ RESEND_API_KEY: "re_test_key", RESEND_FROM_EMAIL: "   " }),
    ).toBeNull();

    expect(
      resolveResendConfig({
        RESEND_API_KEY: "re_test_key",
        RESEND_FROM_EMAIL: "noreply@mail.example.com",
      }),
    ).toEqual({ apiKey: "re_test_key", from: "noreply@mail.example.com" });
  });
});

describe("sendEmail", () => {
  it("reports missing configuration without touching the provider", async () => {
    const result = await sendEmail(
      { to: "user@example.com", subject: "Hello", template },
      dependencies(null),
    );

    expect(result).toEqual({ success: false, reason: "EMAIL_NOT_CONFIGURED" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends rendered HTML and plain text and returns the provider message id", async () => {
    const result = await sendEmail(
      { to: "user@example.com", subject: "Hello", template },
      dependencies(),
    );

    expect(result).toEqual({ success: true, messageId: "email_123" });
    expect(sendMock).toHaveBeenCalledTimes(1);

    const [payload, options] = sendMock.mock.calls[0] ?? [];
    expect(payload?.from).toBe(config.from);
    expect(payload?.to).toBe("user@example.com");
    expect(payload?.subject).toBe("Hello");
    expect(payload?.html).toContain("Hello body");
    expect(payload?.text).toContain("Hello body");
    expect(options).toBeUndefined();
  });

  it("returns a sanitized failure when the provider reports an error", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: {
        name: "validation_error",
        message: "Invalid `to`: user@example.com",
        statusCode: 422,
      },
    });

    const result = await sendEmail(
      { to: "user@example.com", subject: "Hello", template },
      dependencies(),
    );

    expect(result).toEqual({ success: false, reason: "SEND_FAILED", error: "validation_error" });
    // The provider message can echo recipient data, so it must not be logged.
    expect(console.error).toHaveBeenCalledWith("Failed to send email:", "validation_error");
  });

  it("returns a failure when the transport throws", async () => {
    sendMock.mockRejectedValue(new TypeError("fetch failed"));

    const result = await sendEmail(
      { to: "user@example.com", subject: "Hello", template },
      dependencies(),
    );

    expect(result).toEqual({ success: false, reason: "SEND_FAILED", error: "transport_error" });
  });

  it("does not leak unexpected provider error names", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { name: "user@example.com", message: "sensitive details" },
    });

    const result = await sendEmail(
      { to: "user@example.com", subject: "Hello", template },
      dependencies(),
    );

    expect(result).toEqual({ success: false, reason: "SEND_FAILED", error: "transport_error" });
    expect(console.error).toHaveBeenCalledWith("Failed to send email:", "transport_error");
  });

  it("forwards an explicit idempotency key", async () => {
    await sendEmail(
      {
        to: "user@example.com",
        subject: "Hello",
        template,
        idempotencyKey: "workspace-invitation/inv_123",
      },
      dependencies(),
    );

    expect(sendMock.mock.calls[0]?.[1]).toEqual({
      idempotencyKey: "workspace-invitation/inv_123",
    });
  });
});
