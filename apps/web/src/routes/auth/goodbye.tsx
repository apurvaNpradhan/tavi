import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BrandedPage } from "@/features/layout/branded-page";
import { Button } from "@/shared/ui/button";

/**
 * The landing page after an emailed deletion link has been used.
 *
 * The account no longer exists by the time this renders, so the route is
 * public and deliberately offers nothing but a way back to sign-in. Better Auth
 * redirects here from `/api/auth/delete-user/callback`; reaching it any other
 * way is harmless.
 */
export const Route = createFileRoute("/auth/goodbye")({
  component: GoodbyePage,
});

function GoodbyePage() {
  const { t } = useTranslation("auth");

  return (
    <BrandedPage title={t("goodbye.title")} description={t("goodbye.description")}>
      <Button className="w-full" size="lg" render={<Link to="/auth/login" />}>
        {t("goodbye.action")}
      </Button>
    </BrandedPage>
  );
}
