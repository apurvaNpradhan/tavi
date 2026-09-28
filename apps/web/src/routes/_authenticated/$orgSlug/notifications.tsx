import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/notifications/notifications-page";
import { PageTitle } from "@/shared/ui/page-title";

export const Route = createFileRoute("/_authenticated/$orgSlug/notifications")({
  component: NotificationsRoute,
});

function NotificationsRoute() {
  return (
    <>
      <PageTitle title="Notifications" />
      <NotificationsPage />
    </>
  );
}
