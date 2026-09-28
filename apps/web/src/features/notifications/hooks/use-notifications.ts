import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { orpc } from "@/shared/api/api-client";
import { toastManager } from "@/shared/ui/toast";

const notificationPageInput = { limit: 50, offset: 0 };

export const notificationsQueryOptions = () =>
  orpc.notification.list.queryOptions({ input: notificationPageInput });

export const notificationUnreadCountQueryOptions = () =>
  orpc.notification.unreadCount.queryOptions();

export function useNotifications() {
  return useQuery(notificationsQueryOptions());
}

export function useNotificationUnreadCount() {
  return useQuery({ ...notificationUnreadCountQueryOptions(), refetchInterval: 60_000 });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: orpc.notification.list.key() }),
      queryClient.invalidateQueries({ queryKey: orpc.notification.unreadCount.key() }),
    ]);
}

export function useMarkNotificationRead() {
  const { t } = useTranslation("notifications");
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (notificationId: string) => orpc.notification.markRead.call({ notificationId }),
    onSuccess: invalidate,
    onError: () => toastManager.add({ type: "error", title: t("markReadFailed") }),
  });
}

export function useClearNotifications() {
  const { t } = useTranslation("notifications");
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => orpc.notification.clear.call(),
    onSuccess: invalidate,
    onError: () => toastManager.add({ type: "error", title: t("clearFailed") }),
  });
}
