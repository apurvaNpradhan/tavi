import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DeviceCodePage } from "@/features/device-authorization/device-code-page";

const deviceSearchSchema = z.object({ user_code: z.string().optional() });

export const Route = createFileRoute("/device/")({
  validateSearch: deviceSearchSchema,
  component: () => <DeviceCodePage codeFromLink={Route.useSearch().user_code} />,
});
