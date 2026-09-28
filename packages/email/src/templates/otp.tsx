import { EmailCode } from "../components/email-code";
import { EmailLayout } from "../components/email-layout";
import { EmailRequestNotice } from "../components/email-request-notice";
import { EmailHeading, EmailParagraph } from "../components/email-typography";

export type OtpEmailProps = {
  otp: string;
  expiresInMinutes: number;
};

/** Sends a one-time code the recipient types into the app. */
export function OtpEmail({ otp, expiresInMinutes }: OtpEmailProps) {
  return (
    <EmailLayout preview="Your verification code">
      <EmailHeading>Verification code</EmailHeading>
      <EmailParagraph>
        Enter the following verification code when prompted. It expires in {expiresInMinutes}{" "}
        {expiresInMinutes === 1 ? "minute" : "minutes"}.
      </EmailParagraph>
      <EmailCode code={otp} />
      <EmailParagraph>To protect your account, do not share this code.</EmailParagraph>
      <EmailRequestNotice requestedThing="code" />
    </EmailLayout>
  );
}

export default OtpEmail;

export const PreviewProps = {
  otp: "481920",
  expiresInMinutes: 5,
} satisfies OtpEmailProps;
