import { Section } from "@react-email/components";

import { EmailButton } from "../components/email-button";
import { EmailButtonFallback } from "../components/email-button-fallback";
import { EmailLayout } from "../components/email-layout";
import { EmailHeading, EmailParagraph } from "../components/email-typography";

export type WorkspaceInvitationEmailProps = {
  inviterName: string;
  workspaceName: string;
  invitationLink: string;
};

/**
 * Invitation to collaborate in a workspace.
 *
 * Nothing here is security-sensitive for the recipient — the link only joins a
 * workspace they were named into — so the email closes after the action instead
 * of carrying the "Didn't request this?" notice.
 */
export function WorkspaceInvitationEmail({
  inviterName,
  workspaceName,
  invitationLink,
}: WorkspaceInvitationEmailProps) {
  return (
    <EmailLayout preview={`Join ${workspaceName}`}>
      <EmailHeading>Join {workspaceName}</EmailHeading>
      <EmailParagraph>
        {inviterName} invited you to collaborate in the {workspaceName} workspace.
      </EmailParagraph>
      <Section className="pt-[8px] pb-[24px]">
        <EmailButton href={invitationLink}>Accept invitation</EmailButton>
      </Section>
      <EmailButtonFallback href={invitationLink} />
    </EmailLayout>
  );
}

export default WorkspaceInvitationEmail;

export const PreviewProps = {
  inviterName: "Ada Lovelace",
  workspaceName: "Acme",
  invitationLink: "https://app.example.com/invitation/accept/preview-id",
} satisfies WorkspaceInvitationEmailProps;
