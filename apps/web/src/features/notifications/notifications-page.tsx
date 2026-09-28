import {
  useNotifications,
  useMarkNotificationRead,
  useClearNotifications,
} from "./hooks/use-notifications";
import { NotificationInbox } from "./notification-inbox";

/** Workspace shell destination for the signed-in user's in-app inbox. */
export function NotificationsPage() {
  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const clear = useClearNotifications();
  const notifications = notificationsQuery.data?.items ?? [];

  return (
    <NotificationInbox
      notifications={notifications}
      isLoading={notificationsQuery.isPending}
      isError={notificationsQuery.isError}
      isMarkingRead={markRead.isPending}
      isClearing={clear.isPending}
      onMarkRead={(notificationId) => markRead.mutate(notificationId)}
      onClear={() => clear.mutate()}
      onRetry={() => void notificationsQuery.refetch()}
    />
  );
}
