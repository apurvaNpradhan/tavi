import { openapi } from "@orpc/openapi";
import { publicProcedure } from "../orpc/base";
import getInstanceStatus from "./operations/get-instance-status";
import { instanceStatusSchema } from "./schemas";

/**
 * Public setup status.
 *
 * Declared `security: []` so the generated document marks it as reachable
 * without credentials, mirroring the route it replaces.
 */
const getInstanceStatusProcedure = publicProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/instance/status",
      operationId: "getInstanceStatus",
      tags: ["Instance"],
      summary: "Get instance status",
      description:
        "Public setup status. When hasUsers is false the next signup becomes the instance administrator.",
      successDescription: "Instance status",
      spec: (operation) => ({ ...operation, security: [] }),
    }),
  )
  .output(instanceStatusSchema)
  .handler(async () => getInstanceStatus());

/** The instance feature's procedures, mounted under `router.instance`. */
export const instanceRouter = {
  getStatus: getInstanceStatusProcedure,
};
