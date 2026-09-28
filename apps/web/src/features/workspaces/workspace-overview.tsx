import { useTranslation } from "react-i18next";
import { Card, CardDescription, CardHeader } from "@/shared/ui/card";

/**
 * The workspace landing content.
 *
 * Extracted from the `/$orgSlug` index route so the settings dialog can render
 * the same page behind itself: a reload or a shared link then shows settings
 * over somewhere the user recognises, instead of an empty shell.
 *
 * Deliberately does not set the document title — the route that renders it owns
 * that, and two writers would fight over it.
 */
export function WorkspaceOverview() {
  const { t } = useTranslation("workspace");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-bold text-2xl tracking-tight">{t("heading")}</h1>
      <Card>
        <CardHeader>
          <CardDescription>{t("placeholder")}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default WorkspaceOverview;
