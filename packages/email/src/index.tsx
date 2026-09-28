import { DELETE_ACCOUNT_TOKEN_EXPIRY_SECONDS } from "./delete-account-expiry";
import { OTP_EXPIRY_SECONDS } from "./otp-expiry";
import { sendEmail } from "./send-email";
import { DeleteAccountEmail } from "./templates/delete-account";
import { MagicLinkEmail } from "./templates/magic-link";
import { OtpEmail } from "./templates/otp";
import { WorkspaceInvitationEmail } from "./templates/workspace-invitation";

export { DELETE_ACCOUNT_TOKEN_EXPIRY_SECONDS } from "./delete-account-expiry";
export { OTP_EXPIRY_SECONDS } from "./otp-expiry";
export { resetEmailClient, sendEmail } from "./send-email";
export { getResendConfig, isEmailConfigured, type ResendConfig } from "./resend-config";

function minutesFromSeconds(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

function hoursFromSeconds(seconds: number): number {
  return Math.max(1, Math.round(seconds / 3600));
}

export async function sendMagicLinkEmail(
  to: string,
  subject: string,
  data: { magicLink: string; idempotencyKey?: string },
) {
  return sendEmail({
    to,
    subject,
    idempotencyKey: data.idempotencyKey,
    template: <MagicLinkEmail magicLink={data.magicLink} />,
  });
}

export async function sendOtpEmail(
  to: string,
  subject: string,
  data: { otp: string; idempotencyKey?: string },
) {
  return sendEmail({
    to,
    subject,
    idempotencyKey: data.idempotencyKey,
    template: <OtpEmail otp={data.otp} expiresInMinutes={minutesFromSeconds(OTP_EXPIRY_SECONDS)} />,
  });
}

/**
 * `locale` is accepted and forwarded for future localized templates; the
 * bundled templates render in English, so it is currently informational only.
 */
export async function sendDeleteAccountEmail(
  to: string,
  subject: string,
  data: { deleteLink: string; userName?: string; locale?: string | null; idempotencyKey?: string },
) {
  return sendEmail({
    to,
    subject,
    idempotencyKey: data.idempotencyKey,
    template: (
      <DeleteAccountEmail
        deleteLink={data.deleteLink}
        userName={data.userName}
        expiresInHours={hoursFromSeconds(DELETE_ACCOUNT_TOKEN_EXPIRY_SECONDS)}
      />
    ),
  });
}

export async function sendWorkspaceInvitationEmail(
  to: string,
  subject: string,
  data: {
    inviterName: string;
    workspaceName: string;
    invitationLink: string;
    locale?: string | null;
    idempotencyKey?: string;
  },
) {
  return sendEmail({
    to,
    subject,
    idempotencyKey: data.idempotencyKey,
    template: (
      <WorkspaceInvitationEmail
        inviterName={data.inviterName}
        workspaceName={data.workspaceName}
        invitationLink={data.invitationLink}
      />
    ),
  });
}
