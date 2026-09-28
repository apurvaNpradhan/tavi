import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Postgres `bytea` for small binaries that belong in the row itself (avatars).
 * Kept in PostgreSQL so avatars need no object-storage service.
 */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const cuid = () => createId();

const createdAt = timestamp("created_at", { mode: "date" }).defaultNow().notNull();

const updatedAt = timestamp("updated_at", { mode: "date" })
  .defaultNow()
  .$onUpdate(() => new Date())
  .notNull();

// ---------------------------------------------------------------------------
// Auth tables
//
// These mirror the shape Better Auth expects. They are hand-written rather than
// generated so a plugin can be added in `auth.ts` without a schema migration,
// and they are re-exported at the bottom under Better Auth's model names and
// handed to `drizzleAdapter` via the `schema` map.
// ---------------------------------------------------------------------------

export const userTable = pgTable("user", {
  id: text("id").$defaultFn(cuid).primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  locale: text("locale"),
  // How far through first-run setup the user is; see `user/onboarding.ts`.
  // Defaults to the first step, so an un-migrated row is treated as a new user
  // rather than as someone who has finished.
  onboardingStep: text("onboarding_step").default("profile").notNull(),
  createdAt,
  updatedAt,
  // Contributed by the `anonymous` plugin.
  isAnonymous: boolean("is_anonymous").default(false),
  // Contributed by the `admin` plugin.
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { mode: "date" }),
});

export const sessionTable = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt,
    updatedAt: timestamp("updated_at", { mode: "date" })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    // Contributed by the `organization` plugin.
    activeOrganizationId: text("active_organization_id"),
    activeTeamId: text("active_team_id"),
    // Contributed by the `admin` plugin (impersonation).
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const accountTable = pgTable(
  "account",
  {
    id: text("id").$defaultFn(cuid).primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt,
    updatedAt,
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verificationTable = pgTable(
  "verification",
  {
    id: text("id").$defaultFn(cuid).primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userAvatarTable = pgTable(
  "user_avatar",
  {
    id: text("id").$defaultFn(cuid).primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique("user_avatar_user_id_unique")
      .references(() => userTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    data: bytea("data").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index("user_avatar_userId_idx").on(table.userId)],
);

// ---------------------------------------------------------------------------
// Tenancy
//
// `workspace` is a Better Auth *organization* renamed. Keeping the plugin's
// model shape (rather than inventing a parallel tenancy model) is what makes
// invitations, teams, members and dynamic roles work out of the box.
// ---------------------------------------------------------------------------

export const workspaceTable = pgTable("workspace", {
  id: text("id").$defaultFn(cuid).primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

export const workspaceUserTable = pgTable(
  "workspace_member",
  {
    id: text("id").$defaultFn(cuid).primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    // Migration 0006 serializes owner demotions/removals on the parent workspace
    // row and rejects a change that would leave no owner.
    role: text("role").default("member").notNull(),
    joinedAt: timestamp("joined_at", { mode: "date" }).notNull(),
  },
  (table) => [
    index("workspace_member_workspaceId_idx").on(table.workspaceId),
    index("workspace_member_userId_idx").on(table.userId),
    // A user has at most one membership per workspace. Without this, two
    // concurrent invites can race past Better Auth's `findMemberByEmail`
    // pre-check and leave duplicate rows whose differing roles make the
    // permission lookup nondeterministic.
    uniqueIndex("workspace_member_workspaceId_userId_uidx").on(table.workspaceId, table.userId),
  ],
);

/**
 * Per-workspace, admin-editable role definitions backing Better Auth's
 * `dynamicAccessControl`. `owner` is deliberately absent: it stays static so a
 * workspace can never lose its last owner through role editing.
 */
export const workspaceRoleTable = pgTable(
  "workspace_role",
  {
    id: text("id").$defaultFn(cuid).primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    role: text("role").notNull(),
    permission: text("permission").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("workspace_role_workspaceId_idx").on(table.workspaceId),
    index("workspace_role_role_idx").on(table.role),
    // One editable definition per role name per workspace. Concurrent startup
    // seeding or role creation would otherwise insert duplicates.
    uniqueIndex("workspace_role_workspaceId_role_uidx").on(table.workspaceId, table.role),
  ],
);

export const invitationTable = pgTable(
  "invitation",
  {
    id: text("id").$defaultFn(cuid).primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    teamId: text("team_id"),
    status: text("status").default("pending").notNull(),
    // Keep expiry as an absolute instant so API and database timezones agree.
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    createdAt,
    inviterId: text("inviter_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_workspaceId_idx").on(table.workspaceId),
    index("invitation_email_idx").on(table.email),
    index("invitation_inviterId_idx").on(table.inviterId),
  ],
);

/** User-owned activity committed with invitation membership; invitation ID is its dedupe key. */
export const notificationTable = pgTable(
  "notification",
  {
    id: text("id").$defaultFn(cuid).primaryKey(),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitationTable.id, { onDelete: "cascade" }),
    createdAt,
    readAt: timestamp("read_at", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("notification_recipient_invitation_uidx").on(table.recipientId, table.invitationId),
    index("notification_recipient_created_idx").on(table.recipientId, table.createdAt),
  ],
);

export const teamTable = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("team_workspaceId_idx").on(table.workspaceId)],
);

export const teamMemberTable = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("teamMember_teamId_idx").on(table.teamId),
    index("teamMember_userId_idx").on(table.userId),
  ],
);

export const apikeyTable = pgTable(
  "apikey",
  {
    id: text("id").$defaultFn(cuid).primaryKey(),
    configId: text("config_id").default("default").notNull(),
    name: text("name"),
    start: text("start"),
    referenceId: text("reference_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    prefix: text("prefix"),
    key: text("key").notNull(),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "cascade",
    }),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at", { mode: "date" }),
    enabled: boolean("enabled").default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").default(true),
    rateLimitTimeWindow: integer("rate_limit_time_window").default(86400000),
    rateLimitMax: integer("rate_limit_max").default(10),
    requestCount: integer("request_count").default(0),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request", { mode: "date" }),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (table) => [
    index("apikey_configId_idx").on(table.configId),
    index("apikey_key_idx").on(table.key),
    index("apikey_referenceId_idx").on(table.referenceId),
    index("apikey_userId_idx").on(table.userId),
  ],
);

export const deviceCodeTable = pgTable(
  "device_code",
  {
    id: text("id").$defaultFn(cuid).primaryKey(),
    deviceCode: text("device_code").notNull(),
    userCode: text("user_code").notNull(),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    createdAt,
    updatedAt,
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    status: text("status").notNull(),
    lastPolledAt: timestamp("last_polled_at", { mode: "date" }),
    pollingInterval: integer("polling_interval"),
    clientId: text("client_id"),
    scope: text("scope"),
  },
  (table) => [
    uniqueIndex("device_code_device_code_uidx").on(table.deviceCode),
    uniqueIndex("device_code_user_code_uidx").on(table.userCode),
    index("device_code_user_id_idx").on(table.userId),
  ],
);

// ---------------------------------------------------------------------------
// Better Auth model aliases
//
// `drizzleAdapter` is given the `schema` object from `./index.ts`, but the
// plugins look models up by their canonical names.
// ---------------------------------------------------------------------------

export const user = userTable;
export const session = sessionTable;
export const account = accountTable;
export const verification = verificationTable;
export const workspace = workspaceTable;
export const team = teamTable;
export const teamMember = teamMemberTable;
export const workspace_member = workspaceUserTable;
export const invitation = invitationTable;
export const notification = notificationTable;
export const organizationRole = workspaceRoleTable;
export const apikey = apikeyTable;
export const deviceCode = deviceCodeTable;
