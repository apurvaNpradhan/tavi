import { AlertTriangleIcon, MailCheckIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/providers/auth-provider/hooks/use-auth";
import { SettingsSection } from "@/features/settings/settings-section";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { useDeleteAccount } from "@/features/account/hooks/use-delete-account";

/**
 * Account deletion, requested by email rather than by password.
 *
 * Requesting and performing deletion are two separate moments: this section
 * only asks the server to mail a single-use link, and the account is removed
 * when that link is opened. The success state therefore says "check your
 * email", not "you are signed out" — navigating away as if the account were
 * already gone would be a lie.
 *
 * A password is deliberately not collected. Accounts created through social or
 * OIDC sign-in have none, and requiring one would also break any session older
 * than Better Auth's freshness window; proof of the inbox covers both cases.
 */
export function DeleteAccountSection() {
  const { t } = useTranslation("settings");
  const { user } = useAuth();
  const deleteAccount = useDeleteAccount();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleRequest() {
    setProblem(null);

    try {
      await deleteAccount.mutateAsync();
      setSentTo(user?.email ?? "");
      setIsConfirmOpen(false);
    } catch {
      setProblem(t("deleteAccount.failed"));
      setIsConfirmOpen(false);
    }
  }

  if (sentTo !== null) {
    return (
      <SettingsSection
        title={t("deleteAccount.title")}
        description={t("deleteAccount.description")}
      >
        <output className="flex gap-3 rounded-lg border border-border bg-muted/50 p-4 text-sm">
          <MailCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">{t("deleteAccount.sentTitle")}</p>
            <p className="text-muted-foreground">
              {t("deleteAccount.sentDescription", { email: sentTo })}
            </p>
          </div>
        </output>

        <div>
          <Button type="button" variant="outline" onClick={() => setSentTo(null)}>
            {t("deleteAccount.startOver")}
          </Button>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title={t("deleteAccount.title")} description={t("deleteAccount.description")}>
      <div className="flex flex-col gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex gap-3">
          <AlertTriangleIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-destructive-foreground"
          />
          <p className="text-balance text-sm">{t("deleteAccount.warning")}</p>
        </div>

        {problem ? (
          <p role="alert" className="text-destructive-foreground text-sm">
            {problem}
          </p>
        ) : null}

        <div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setProblem(null);
              setIsConfirmOpen(true);
            }}
          >
            {t("deleteAccount.submit")}
          </Button>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAccount.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteAccount.confirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button type="button" variant="outline" />}>
              {t("close")}
            </AlertDialogClose>
            <Button
              type="button"
              variant="destructive"
              loading={deleteAccount.isPending}
              disabled={deleteAccount.isPending}
              onClick={() => void handleRequest()}
            >
              {t("deleteAccount.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </SettingsSection>
  );
}

export default DeleteAccountSection;
