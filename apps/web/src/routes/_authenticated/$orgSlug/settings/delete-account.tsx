import { createFileRoute } from "@tanstack/react-router";
import { DeleteAccountSection } from "@/features/account/delete-account-section";

export const Route = createFileRoute("/_authenticated/$orgSlug/settings/delete-account")({
  component: DeleteAccountSection,
});
