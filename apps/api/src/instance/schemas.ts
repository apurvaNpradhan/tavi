import { z } from "zod";

/** Public setup status: booleans only, never counts or identities. */
export const instanceStatusSchema = z
  .object({ hasUsers: z.boolean(), hasAdmin: z.boolean() })
  .meta({ id: "InstanceStatus" });
