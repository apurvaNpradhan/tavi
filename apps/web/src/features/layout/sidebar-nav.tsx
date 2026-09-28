import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageCircle, UsersRound, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/sidebar";

type WorkspaceNavItem = {
  icon: LucideIcon;
  title: string;
  disabled?: boolean;
  /** Resolved path used only for matching the current location. */
  path?: string;
  destination?: "dashboard" | "members";
};

type WorkspaceNavGroup = {
  label: string;
  items: WorkspaceNavItem[];
};

/**
 * The workspace's primary navigation.
 *
 * Destinations live under the current workspace, so the Dashboard item is
 * inert until an organization id is known; Conversations is parked until the
 * feature lands.
 */
export function SidebarNav({ orgSlug }: { orgSlug?: string }) {
  const { t } = useTranslation("dashboard");
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();

  const groups: WorkspaceNavGroup[] = [
    {
      label: t("nav.today"),
      items: [
        {
          icon: Home,
          title: t("nav.dashboard"),
          path: `/${orgSlug ?? ""}`,
          destination: "dashboard",
        },
        {
          icon: UsersRound,
          title: t("nav.members"),
          path: `/${orgSlug ?? ""}/members`,
          destination: "members",
        },
      ],
    },
    {
      label: t("nav.conversationGroup"),
      items: [
        {
          icon: MessageCircle,
          title: t("nav.conversations"),
          disabled: true,
        },
      ],
    },
  ];

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const disabled = item.disabled || !orgSlug;
                const isActive = Boolean(orgSlug) && pathname === item.path;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      disabled={disabled}
                      isActive={isActive}
                      tooltip={item.title}
                      render={
                        !disabled ? (
                          <Link
                            to={item.destination === "members" ? "/$orgSlug/members" : "/$orgSlug"}
                            params={{ orgSlug }}
                            onClick={() => {
                              if (isMobile) setOpenMobile(false);
                            }}
                          />
                        ) : undefined
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

export default SidebarNav;
