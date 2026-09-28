-- Deduplicate before the unique indexes land. Rows predate the constraints
-- (concurrent seeding / membership writes), and creating an index over a table
-- with duplicates would fail the migration and brick startup.
--
-- Memberships: keep an `owner` row when duplicates disagree so ownership can
-- never be dropped; otherwise keep the earliest-joined row (the original
-- membership), tie-broken by id for determinism.
DELETE FROM "workspace_member"
WHERE "workspace_member"."id" IN (
  SELECT ranked."id" FROM (
    SELECT
      "workspace_member"."id" AS "id",
      row_number() OVER (
        PARTITION BY "workspace_member"."workspace_id", "workspace_member"."user_id"
        ORDER BY
          ('owner' = ANY(string_to_array(replace("workspace_member"."role", ' ', ''), ','))) DESC,
          "workspace_member"."joined_at" ASC,
          "workspace_member"."id" ASC
      ) AS "rn"
    FROM "workspace_member"
  ) ranked
  WHERE ranked."rn" > 1
);--> statement-breakpoint
-- Role definitions: keep the most recently updated row, so an admin's edit is
-- not replaced by a stale duplicate; tie-broken by id for determinism.
DELETE FROM "workspace_role"
WHERE "workspace_role"."id" IN (
  SELECT ranked."id" FROM (
    SELECT
      "workspace_role"."id" AS "id",
      row_number() OVER (
        PARTITION BY "workspace_role"."workspace_id", "workspace_role"."role"
        ORDER BY "workspace_role"."updated_at" DESC, "workspace_role"."id" DESC
      ) AS "rn"
    FROM "workspace_role"
  ) ranked
  WHERE ranked."rn" > 1
);--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_role_workspaceId_role_uidx" ON "workspace_role" USING btree ("workspace_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_member_workspaceId_userId_uidx" ON "workspace_member" USING btree ("workspace_id","user_id");
