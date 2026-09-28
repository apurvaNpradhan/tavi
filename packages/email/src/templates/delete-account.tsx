import { Section } from "@react-email/components";

import { EmailButton } from "../components/email-button";
import { EmailButtonFallback } from "../components/email-button-fallback";
import { EmailLayout } from "../components/email-layout";
import { EmailRequestNotice } from "../components/email-request-notice";
import { EmailHeading, EmailParagraph } from "../components/email-typography";

export type DeleteAccountEmailProps = {
  deleteLink: string;
  userName?: string;
  expiresInHours: number;
};

/**
 * Confirmation link for account deletion.
 *
 * The link is the whole security boundary: it is single-use, expires, and only
 * proves control of the account's address. The copy says so plainly, because a
 * user who did not request this must know that ignoring the message leaves the
 * account untouched. The button carries the destructive fill, per `DESIGN.md`.
 */
export function DeleteAccountEmail({
  deleteLink,
  userName,
  expiresInHours,
}: DeleteAccountEmailProps) {
  const greeting = userName?.trim();

  return (
    <EmailLayout preview="Confirm account deletion">
      <EmailHeading>Confirm account deletion</EmailHeading>
      <EmailParagraph>
        {greeting ? `Hi ${greeting}, ` : ""}we received a request to permanently delete your
        account. Click the button below to confirm.
      </EmailParagraph>
      <Section className="pt-[8px] pb-[24px]">
        <EmailButton href={deleteLink} tone="destructive">
          Delete my account
        </EmailButton>
      </Section>
      <EmailButtonFallback href={deleteLink} />
      <EmailParagraph>
        This removes your account and the data it solely owns, and cannot be undone. The link
        expires in {expiresInHours} {expiresInHours === 1 ? "hour" : "hours"}. Until you confirm,
        your account stays as it is.
      </EmailParagraph>
      <EmailRequestNotice requestedThing="deletion link" />
    </EmailLayout>
  );
}

export default DeleteAccountEmail;

export const PreviewProps = {
  deleteLink: "https://api.example.com/api/auth/delete-user/callback?token=preview-token",
  userName: "Ada",
  expiresInHours: 24,
} satisfies DeleteAccountEmailProps;
