import { openapi } from "@orpc/openapi";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { authedProcedure } from "../orpc/base";
import { requireWorkspace } from "../orpc/workspace";
import { getTeamSummary, getTeamWorkspaceId } from "./operations/get-team-summary";
import { teamSummarySchema } from "./output";

const getTeamSummaryInput = z.object({ teamId: z.string().min(1) });

/** Reads a team only after resolving and authorizing its owning workspace. */
export const getTeamSummaryProcedure = authedProcedure
  .meta(
    openapi({
      method: "GET",
      path: "/team/{teamId}",
      operationId: "getTeamSummary",
      tags: ["Team"],
      summary: "Get team summary",
      description: "Read a team's name and creation time within its authorized workspace.",
      successDescription: "The team summary",
    }),
  )
  .input(getTeamSummaryInput)
  .use(
    requireWorkspace(
      (input: z.infer<typeof getTeamSummaryInput>) => getTeamWorkspaceId(input.teamId),
      { workspace: ["read"] },
    ),
  )
  .output(teamSummarySchema)
  .handler(async ({ input, context }) => {
    const team = await getTeamSummary(input.teamId, context.workspaceId);
    if (!team) throw new ORPCError("NOT_FOUND", { message: "Team not found" });
    return team;
  });

/** The team feature's procedures, mounted under `router.team`. */
export const teamRouter = {
  getSummary: getTeamSummaryProcedure,
};
