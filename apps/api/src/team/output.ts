import { z } from "../openapi";

/** A team summary that omits membership and other private workspace data. */
export const teamSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    createdAt: z.date(),
  })
  .meta({ id: "TeamSummary" });
