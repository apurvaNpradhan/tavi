import { relations } from "drizzle-orm";
import {
  accountTable,
  apikeyTable,
  invitationTable,
  notificationTable,
  sessionTable,
  teamMemberTable,
  teamTable,
  userTable,
  verificationTable,
  workspaceRoleTable,
  workspaceTable,
  workspaceUserTable,
} from "./schema";

/**
 * All Drizzle relations live here, separate from table definitions, so the
 * schema file stays a readable catalogue of columns and constraints.
 */

export const userTableRelations = relations(userTable, ({ many }) => ({
  sessions: many(sessionTable),
  accounts: many(accountTable),
  teamMembers: many(teamMemberTable),
  workspaceMembers: many(workspaceUserTable),
  invitations: many(invitationTable),
  notifications: many(notificationTable),
}));

export const sessionTableRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const accountTableRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accountTable.userId],
    references: [userTable.id],
  }),
}));

export const verificationTableRelations = relations(verificationTable, () => ({}));

export const apikeyTableRelations = relations(apikeyTable, ({ one }) => ({
  reference: one(userTable, {
    fields: [apikeyTable.referenceId],
    references: [userTable.id],
  }),
}));

export const workspaceTableRelations = relations(workspaceTable, ({ many }) => ({
  teams: many(teamTable),
  members: many(workspaceUserTable),
  invitations: many(invitationTable),
  roles: many(workspaceRoleTable),
}));

export const workspaceUserTableRelations = relations(workspaceUserTable, ({ one }) => ({
  workspace: one(workspaceTable, {
    fields: [workspaceUserTable.workspaceId],
    references: [workspaceTable.id],
  }),
  user: one(userTable, {
    fields: [workspaceUserTable.userId],
    references: [userTable.id],
  }),
}));

export const workspaceRoleTableRelations = relations(workspaceRoleTable, ({ one }) => ({
  workspace: one(workspaceTable, {
    fields: [workspaceRoleTable.workspaceId],
    references: [workspaceTable.id],
  }),
}));

export const invitationTableRelations = relations(invitationTable, ({ one }) => ({
  workspace: one(workspaceTable, {
    fields: [invitationTable.workspaceId],
    references: [workspaceTable.id],
  }),
  inviter: one(userTable, {
    fields: [invitationTable.inviterId],
    references: [userTable.id],
  }),
}));

export const notificationTableRelations = relations(notificationTable, ({ one }) => ({
  recipient: one(userTable, {
    fields: [notificationTable.recipientId],
    references: [userTable.id],
  }),
  invitation: one(invitationTable, {
    fields: [notificationTable.invitationId],
    references: [invitationTable.id],
  }),
}));

export const teamTableRelations = relations(teamTable, ({ one, many }) => ({
  workspace: one(workspaceTable, {
    fields: [teamTable.workspaceId],
    references: [workspaceTable.id],
  }),
  members: many(teamMemberTable),
}));

export const teamMemberTableRelations = relations(teamMemberTable, ({ one }) => ({
  team: one(teamTable, {
    fields: [teamMemberTable.teamId],
    references: [teamTable.id],
  }),
  user: one(userTable, {
    fields: [teamMemberTable.userId],
    references: [userTable.id],
  }),
}));
