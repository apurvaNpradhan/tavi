import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsLayout } from "@/features/settings/settings-layout";

export const Route = createFileRoute("/_authenticated/$orgSlug/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  const { orgSlug } = Route.useParams();
  return (
    <SettingsLayout orgSlug={orgSlug}>
      <Outlet />
    </SettingsLayout>
  );
}
