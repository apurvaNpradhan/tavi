import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { CheckIcon, ChevronsUpDownIcon, LogOutIcon, PlusIcon, SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/providers/auth-provider/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@/shared/ui/menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/shared/ui/sidebar";
import { sessionQueryKey } from "@/features/authentication/hooks/use-session";
import { useWorkspaces, workspacesQueryKey } from "@/features/workspaces/hooks/use-workspaces";
import { authClient } from "@/shared/auth/auth-client";
import { getInitials } from "@/shared/lib/get-initials";
import { resolveAvatarSrc } from "@/features/account/resolve-avatar-src";
import { createSettingsOpenState } from "@/features/settings/settings-navigation";
import { cn } from "@/shared/lib/utils";

/** The workspace's first letter, shown when it has no logo. */
function WorkspaceMark({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent font-medium text-sidebar-accent-foreground text-xs uppercase",
        className,
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}

/**
 * The combined workspace/account menu, Linear-style.
 *
 * The trigger shows the active workspace; the popup links to the workspace's
 * settings and members, switches workspaces through a submenu, and signs out.
 * Workspace edges are links, not actions: the workspace layout is what marks
 * an organization active, so switching is just navigation and keeps
 * middle-click and open-in-new-tab working.
 */
export function AccountMenu({ orgSlug }: { orgSlug?: string }) {
  const { t } = useTranslation("dashboard");
  const { isMobile, setOpenMobile } = useSidebar();
  const queryClient = useQueryClient();
  const { data: workspaces } = useWorkspaces();
  const { user } = useAuth();
  const navigate = useNavigate();

  const active = workspaces?.find((workspace) => workspace.slug === orgSlug);
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  async function signOut() {
    setOpenMobile(false);
    await authClient.signOut();
    // Clear the shared caches so the login gate cannot read the signed-out
    // session and bounce straight back into the workspace.
    queryClient.setQueryData(sessionQueryKey, null);
    queryClient.removeQueries({ queryKey: workspacesQueryKey });
    await navigate({ to: "/auth/login" });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={t("accountMenu.switchWorkspace")}
                className="data-[popup-open]:bg-sidebar-accent"
              />
            }
          >
            <WorkspaceMark name={active?.name ?? t("accountMenu.switchWorkspace")} />
            <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium text-sm">
                {active?.name ?? t("accountMenu.switchWorkspace")}
              </span>
            </span>
            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </MenuTrigger>
          <MenuPopup
            align="start"
            className="w-64"
            side={isMobile ? "bottom" : "right"}
            sideOffset={8}
          >
            {/*
              Identity, not an action: rendered as a plain row rather than a
              menu item so it cannot be focused or activated, which would put a
              dead stop in the keyboard path between opening the menu and its
              first real entry.
            */}
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <Avatar className="size-8 border">
                <AvatarImage src={resolveAvatarSrc(user?.image ?? undefined)} alt="" />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.name || user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate font-medium text-sm">
                  {user?.name || t("accountMenu.unnamedUser")}
                </span>
                {user?.email ? (
                  <span className="truncate text-muted-foreground text-xs">{user.email}</span>
                ) : null}
              </div>
            </div>
            <MenuSeparator />
            <MenuLinkItem
              render={
                <Link
                  to="/$orgSlug/settings"
                  params={{ orgSlug }}
                  state={createSettingsOpenState}
                  onClick={closeOnMobile}
                />
              }
            >
              <SettingsIcon />
              {t("accountMenu.settings")}
            </MenuLinkItem>

            <MenuSub>
              <MenuSubTrigger>{t("accountMenu.switchWorkspace")}</MenuSubTrigger>
              <MenuSubPopup className="w-56">
                <MenuGroup>
                  <MenuGroupLabel>{t("accountMenu.workspaces")}</MenuGroupLabel>
                  {workspaces?.map((workspace) => (
                    <MenuLinkItem
                      key={workspace.id}
                      className="gap-2"
                      render={
                        <Link
                          to="/$orgSlug"
                          params={{ orgSlug: workspace.slug }}
                          onClick={closeOnMobile}
                        />
                      }
                    >
                      <WorkspaceMark name={workspace.name} className="size-6" />
                      <span className="truncate">{workspace.name}</span>
                      {workspace.slug === orgSlug ? <CheckIcon className="ml-auto size-4" /> : null}
                    </MenuLinkItem>
                  ))}
                </MenuGroup>
                <MenuSeparator />
                <MenuLinkItem render={<Link to="/onboarding" onClick={closeOnMobile} />}>
                  <PlusIcon />
                  {t("accountMenu.createOrJoin")}
                </MenuLinkItem>
              </MenuSubPopup>
            </MenuSub>
            <MenuSeparator />
            <MenuItem variant="destructive" onClick={() => void signOut()}>
              <LogOutIcon />
              {t("accountMenu.logOut")}
            </MenuItem>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default AccountMenu;
