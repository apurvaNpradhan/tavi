import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import PageTitle from "@/shared/ui/page-title";
import { WorkspaceOverview } from "@/features/workspaces/workspace-overview";

export const Route = createFileRoute("/_authenticated/$orgSlug/")({
  component: WorkspaceOverviewPage,
});

/**
 * The workspace landing page. Domain features replace this body.
 *
 * The content itself lives in `WorkspaceOverview` so the settings dialog can
 * render the same page behind itself; only the document title is decided here.
 */
function WorkspaceOverviewPage() {
  const { t } = useTranslation("workspace");

  return (
    <>
      <PageTitle title={t("heading")} />
      <WorkspaceOverview />
    </>
  );
}
