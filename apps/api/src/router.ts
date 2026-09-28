import { configRouter } from "./config/procedures";
import { instanceRouter } from "./instance/procedures";
import { userRouter } from "./user/procedures";
import { teamRouter } from "./team/procedures";
import { invitationRouter, memberRouter, workspaceRoleRouter } from "./invitation/procedures";
import { notificationRouter } from "./notification/procedures";

/**
 * The oRPC router. Its feature routers define the public names and this module
 * assembles them without importing server startup into the typed browser client.
 */
export const router = {
  instance: instanceRouter,
  user: userRouter,
  config: configRouter,
  team: teamRouter,
  invitation: invitationRouter,
  member: memberRouter,
  workspaceRole: workspaceRoleRouter,
  notification: notificationRouter,
};

export type ApiRouter = typeof router;
