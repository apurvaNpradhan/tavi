import { Section } from "@react-email/components";

import { EmailButton } from "../components/email-button";
import { EmailButtonFallback } from "../components/email-button-fallback";
import { EmailLayout } from "../components/email-layout";
import { EmailRequestNotice } from "../components/email-request-notice";
import { EmailHeading, EmailParagraph } from "../components/email-typography";

export type MagicLinkEmailProps = {
  magicLink: string;
};

/**
 * Passwordless sign-in link.
 *
 * react-email requires a default export per template file — without one the
 * preview server reports "does not contain a default exported function" and
 * lists nothing.
 */
export function MagicLinkEmail({ magicLink }: MagicLinkEmailProps) {
  return (
    <EmailLayout preview="Your sign-in link">
      <EmailHeading>Sign in to Tavi</EmailHeading>
      <EmailParagraph>
        Click the button below to sign in. This link can only be used once and expires shortly.
      </EmailParagraph>
      <Section className="pt-[8px] pb-[24px]">
        <EmailButton href={magicLink}>Sign in</EmailButton>
      </Section>
      <EmailButtonFallback href={magicLink} />
      <EmailRequestNotice requestedThing="sign-in link" />
    </EmailLayout>
  );
}

export default MagicLinkEmail;

/** Sample data so the preview renders with realistic content. */
export const PreviewProps = {
  magicLink: "https://app.example.com/auth/magic?token=preview-token",
} satisfies MagicLinkEmailProps;
