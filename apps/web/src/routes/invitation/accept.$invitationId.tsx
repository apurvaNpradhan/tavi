import { createFileRoute } from "@tanstack/react-router";
import { InvitationAcceptancePage } from "@/features/invitations/invitation-acceptance-page";

export const Route = createFileRoute("/invitation/accept/$invitationId")({
  component: InvitationAcceptanceRoute,
});

function InvitationAcceptanceRoute() {
  const { invitationId } = Route.useParams();
  return <InvitationAcceptancePage invitationId={invitationId} />;
}
