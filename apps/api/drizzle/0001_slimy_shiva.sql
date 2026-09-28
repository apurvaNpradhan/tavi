DROP TABLE "activity" CASCADE;--> statement-breakpoint
DROP TABLE "attachment" CASCADE;--> statement-breakpoint
DROP TABLE "job_lease" CASCADE;--> statement-breakpoint
DROP TABLE "note_comment" CASCADE;--> statement-breakpoint
DROP TABLE "note" CASCADE;--> statement-breakpoint
DROP TABLE "note_tag" CASCADE;--> statement-breakpoint
DROP TABLE "tag" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "default_org_slug" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarding_step" text DEFAULT 'profile' NOT NULL;--> statement-breakpoint
-- Existing workspace members already completed the setup that these columns track.
UPDATE "user" AS u
SET onboarding_step = 'completed',
    default_org_slug = COALESCE(
      NULLIF(u.default_org_slug, ''),
      (SELECT w.slug FROM workspace_member AS wm
       JOIN workspace AS w ON w.id = wm.workspace_id
       WHERE wm.user_id = u.id
       ORDER BY wm.joined_at, wm.id
       LIMIT 1),
      ''
    )
WHERE EXISTS (SELECT 1 FROM workspace_member AS wm WHERE wm.user_id = u.id);
