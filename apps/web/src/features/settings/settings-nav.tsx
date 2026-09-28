import { Link, useLocation } from "@tanstack/react-router";
import { AlertTriangleIcon, KeyIcon, LaptopIcon, PaletteIcon, UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";

const SECTIONS = [
  // Profile is the settings index, so its canonical URL is `/settings` itself.
  { path: "/$orgSlug/settings", labelKey: "sections.profile", Icon: UserIcon },
  { path: "/$orgSlug/settings/appearance", labelKey: "sections.appearance", Icon: PaletteIcon },
  { path: "/$orgSlug/settings/sessions", labelKey: "sections.sessions", Icon: LaptopIcon },
  { path: "/$orgSlug/settings/api-keys", labelKey: "sections.apiKeys", Icon: KeyIcon },
  {
    path: "/$orgSlug/settings/delete-account",
    labelKey: "sections.deleteAccount",
    Icon: AlertTriangleIcon,
    destructive: true,
  },
] as const;

/**
 * The settings sections.
 *
 * Links rather than tabs, because each section is its own URL: that is what
 * makes a section deep-linkable and shareable, and it keeps browser Back
 * working between sections instead of only out of the dialog.
 */
export function SettingsNav({ orgSlug }: { orgSlug: string }) {
  const { t } = useTranslation("settings");
  const { pathname } = useLocation();

  return (
    <nav
      aria-label={t("navLabel")}
      className="flex shrink-0 gap-1 overflow-x-auto sm:w-44 sm:flex-col sm:overflow-visible"
    >
      {SECTIONS.map(({ path, labelKey, Icon, ...rest }) => {
        const isCurrent = pathname === path.replace("$orgSlug", orgSlug);
        const isDestructive = "destructive" in rest && rest.destructive;

        return (
          <Link
            key={path}
            to={path}
            params={{ orgSlug }}
            state={true}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
              "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              isCurrent
                ? "bg-accent font-medium text-accent-foreground"
                : isDestructive
                  ? "text-destructive-foreground"
                  : "text-muted-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {labelKey === "sections.profile"
              ? t("sections.profile")
              : labelKey === "sections.appearance"
                ? t("sections.appearance")
                : labelKey === "sections.sessions"
                  ? t("sections.sessions")
                  : labelKey === "sections.apiKeys"
                    ? t("sections.apiKeys")
                    : t("sections.deleteAccount")}
          </Link>
        );
      })}
    </nav>
  );
}

export default SettingsNav;
