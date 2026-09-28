import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSection } from "@/features/appearance/appearance-section";

export const Route = createFileRoute("/_authenticated/$orgSlug/settings/appearance")({
  component: AppearanceSection,
});
