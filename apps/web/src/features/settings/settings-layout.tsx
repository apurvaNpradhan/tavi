import { type ReactNode } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import PageTitle from "@/shared/ui/page-title";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/shared/ui/dialog";
import { WorkspaceOverview } from "@/features/workspaces/workspace-overview";
import { SettingsNav } from "./settings-nav";
import { settingsCloseSteps } from "./settings-navigation";

/** Shows workspace settings in a deep-linkable dialog over the workspace page. */
export function SettingsLayout({ orgSlug, children }: { orgSlug: string; children: ReactNode }) {
  const navigate = useNavigate();
  const router = useRouter();
  const { t } = useTranslation("settings");

  const close = () => {
    const steps = settingsCloseSteps(router.history.location.state);
    if (steps !== null) {
      router.history.go(-steps);
      return;
    }

    void navigate({ to: "/$orgSlug", params: { orgSlug }, replace: true });
  };

  return (
    <>
      <PageTitle title={t("title")} />
      <WorkspaceOverview />
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogPopup className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <DialogPanel className="flex flex-col gap-6 sm:flex-row">
            <SettingsNav orgSlug={orgSlug} />
            <div className="min-w-0 flex-1">{children}</div>
          </DialogPanel>
        </DialogPopup>
      </Dialog>
    </>
  );
}
