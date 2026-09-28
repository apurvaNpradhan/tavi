import { LaptopIcon, ShieldAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/providers/auth-provider/hooks/use-auth";
import { SettingsSection } from "@/features/settings/settings-section";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { toastManager } from "@/shared/ui/toast";
import {
  SessionNotFreshError,
  type Session,
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from "@/features/account/hooks/use-sessions";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
}

/**
 * Everywhere the account is signed in.
 *
 * The current session is identified by its token so it is labelled rather than
 * offering a revoke button that would be an unexplained sign-out.
 *
 * Listing sessions requires a session created in the last 24 hours, so an older
 * one gets an explanation instead of an error or an empty list — the list is
 * unavailable, not empty, and the two must not look the same.
 */
export function SessionsSection() {
  const { t } = useTranslation("settings");
  const { session } = useAuth();
  const { data: sessions, isPending, error } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();

  const currentToken = session?.session?.token;

  async function handleRevoke(target: Session) {
    try {
      await revokeSession.mutateAsync(target.token);
      toastManager.add({ type: "success", title: t("sessions.revoked") });
    } catch {
      toastManager.add({ type: "error", title: t("sessions.revokeFailed") });
    }
  }

  async function handleRevokeOthers() {
    try {
      await revokeOthers.mutateAsync();
      toastManager.add({ type: "success", title: t("sessions.revokeOthersDone") });
    } catch {
      toastManager.add({ type: "error", title: t("sessions.revokeOthersFailed") });
    }
  }

  if (error instanceof SessionNotFreshError) {
    return (
      <SettingsSection title={t("sessions.title")} description={t("sessions.description")}>
        <div className="flex gap-3 rounded-lg border border-input bg-muted/40 p-4">
          <ShieldAlertIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <div className="flex flex-col gap-1">
            <p className="font-medium text-sm">{t("sessions.notFreshTitle")}</p>
            <p className="text-balance text-muted-foreground text-sm">
              {t("sessions.notFreshDescription")}
            </p>
          </div>
        </div>
      </SettingsSection>
    );
  }

  const otherSessions = (sessions ?? []).filter((item) => item.token !== currentToken);

  return (
    <SettingsSection title={t("sessions.title")} description={t("sessions.description")}>
      <div className="flex flex-col gap-4">
        {isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {(sessions ?? []).map((item) => {
              const isCurrent = item.token === currentToken;
              const signedIn = formatDate(item.createdAt);
              const expires = formatDate(item.expiresAt);

              return (
                <li key={item.id} className="flex items-center gap-3 p-3">
                  <LaptopIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium text-sm">
                        {item.userAgent?.trim() || t("sessions.unknownDevice")}
                      </span>
                      {isCurrent ? (
                        <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-muted-foreground text-xs">
                          {t("sessions.current")}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("sessions.ip")} {item.ipAddress?.trim() || t("sessions.unknownIp")}
                      {signedIn ? ` · ${t("sessions.signedIn")} ${signedIn}` : ""}
                      {expires ? ` · ${t("sessions.expires")} ${expires}` : ""}
                    </span>
                  </div>
                  {isCurrent ? null : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={revokeSession.isPending}
                      onClick={() => void handleRevoke(item)}
                    >
                      {t("sessions.revoke")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!isPending && otherSessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("sessions.empty")}</p>
        ) : null}

        {otherSessions.length > 0 ? (
          <div>
            <Button
              type="button"
              variant="outline"
              loading={revokeOthers.isPending}
              disabled={revokeOthers.isPending}
              onClick={() => void handleRevokeOthers()}
            >
              {t("sessions.revokeOthers")}
            </Button>
          </div>
        ) : null}
      </div>
    </SettingsSection>
  );
}

export default SessionsSection;
