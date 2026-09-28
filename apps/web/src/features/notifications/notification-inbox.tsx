import { BellIcon, CheckCheckIcon, InboxIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

/** A notification as presented in the signed-in inbox. */
export type InboxNotification = {
  id: string;
  type?: string;
  title?: string;
  createdAt: Date | string;
  readAt?: Date | string | null;
};

type NotificationInboxProps = {
  notifications: InboxNotification[];
  isLoading?: boolean;
  isError?: boolean;
  isMarkingRead?: boolean;
  isClearing?: boolean;
  onMarkRead: (notificationId: string) => void;
  onClear: () => void;
  onRetry: () => void;
};

function formatReceivedAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Inbox content with explicit loading, failure, and empty states. */
export function NotificationInbox({
  notifications,
  isLoading = false,
  isError = false,
  isMarkingRead = false,
  isClearing = false,
  onMarkRead,
  onClear,
  onRetry,
}: NotificationInboxProps) {
  const { t } = useTranslation("notifications");
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <section aria-labelledby="notification-inbox-title" className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h1
            id="notification-inbox-title"
            className="mt-2 font-heading font-semibold text-3xl tracking-tight"
          >
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
            {unreadCount === 0 ? t("caughtUp") : t("unreadCount", { count: unreadCount })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={notifications.length === 0 || isClearing || isLoading}
          loading={isClearing}
          onClick={onClear}
        >
          <CheckCheckIcon aria-hidden="true" />
          {t("clearAll")}
        </Button>
      </div>

      {isLoading ? (
        <div aria-label={t("loading")} aria-busy="true" className="flex flex-col gap-3">
          {[0, 1, 2].map((item) => (
            <Card key={item} className="gap-3 p-5">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/5" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="items-center gap-3 p-10 text-center">
          <BellIcon aria-hidden="true" className="size-6 text-muted-foreground" />
          <h2 className="font-medium">{t("loadFailedTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("loadFailedDescription")}</p>
          <Button variant="outline" onClick={onRetry}>
            {t("retry")}
          </Button>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="items-center gap-3 p-10 text-center">
          <InboxIcon aria-hidden="true" className="size-6 text-muted-foreground" />
          <h2 className="font-medium">{t("emptyTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
        </Card>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          {notifications.map((notification) => {
            const isUnread = !notification.readAt;
            return (
              <article
                key={notification.id}
                className="flex items-start gap-4 px-5 py-4"
                aria-label={
                  isUnread
                    ? t("unreadLabel", {
                        title:
                          notification.title ??
                          t(
                            notification.type === "invitation.accepted"
                              ? "invitationAccepted"
                              : "unknownNotification",
                          ),
                      })
                    : notification.title
                }
              >
                <span
                  aria-hidden="true"
                  className={`mt-2 size-2 shrink-0 rounded-full ${isUnread ? "bg-foreground" : "bg-transparent"}`}
                />
                <div className="min-w-0 flex-1">
                  <h2 className={`text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>
                    {notification.title ??
                      t(
                        notification.type === "invitation.accepted"
                          ? "invitationAccepted"
                          : "unknownNotification",
                      )}
                  </h2>
                  {formatReceivedAt(notification.createdAt) ? (
                    <time
                      className="mt-2 block font-mono text-xs text-muted-foreground"
                      dateTime={new Date(notification.createdAt).toISOString()}
                    >
                      {formatReceivedAt(notification.createdAt)}
                    </time>
                  ) : null}
                </div>
                {isUnread ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isMarkingRead}
                    onClick={() => onMarkRead(notification.id)}
                    aria-label={t("markRead", {
                      title:
                        notification.title ??
                        t(
                          notification.type === "invitation.accepted"
                            ? "invitationAccepted"
                            : "unknownNotification",
                        ),
                    })}
                  >
                    {t("markReadAction")}
                  </Button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
