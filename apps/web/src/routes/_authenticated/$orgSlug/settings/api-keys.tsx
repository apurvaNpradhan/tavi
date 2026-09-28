import { createFileRoute } from "@tanstack/react-router";
import { ApiKeysSection } from "@/features/api-keys/api-keys-section";

export const Route = createFileRoute("/_authenticated/$orgSlug/settings/api-keys")({
  component: ApiKeysSection,
});
