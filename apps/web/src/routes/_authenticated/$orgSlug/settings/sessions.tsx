import { createFileRoute } from "@tanstack/react-router";
import { SessionsSection } from "@/features/account/sessions-section";

export const Route = createFileRoute("/_authenticated/$orgSlug/settings/sessions")({
  component: SessionsSection,
});
