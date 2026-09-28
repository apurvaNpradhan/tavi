import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DeviceApprovePage } from "@/features/device-authorization/device-approve-page";

const approveSearchSchema = z.object({ user_code: z.string().optional() });

export const Route = createFileRoute("/device/approve")({
  validateSearch: approveSearchSchema,
  component: () => <DeviceApprovePage codeFromLink={Route.useSearch().user_code} />,
});
