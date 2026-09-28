import { createFileRoute } from "@tanstack/react-router";
import { ProfileSection } from "@/features/account/profile-section";

/**
 * The settings entry point, which is also the profile section.
 *
 * Deliberately a destination rather than a redirect to `/settings/profile`:
 * redirecting would mean `/settings` — the URL the account menu and any
 * bookmark use — never appears, and making it a non-replacing redirect instead
 * would trap Back, because returning to `/settings` would forward straight to
 * the section again. Rendering the default section here keeps one URL per
 * section and one history entry per visit.
 */
export const Route = createFileRoute("/_authenticated/$orgSlug/settings/")({
  component: ProfileSection,
});
