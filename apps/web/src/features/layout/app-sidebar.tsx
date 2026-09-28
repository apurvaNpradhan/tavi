import { useRouterState } from "@tanstack/react-router";
import { AccountMenu } from "@/features/layout/account-menu";
import { Logo } from "@/features/layout/logo";
import { SidebarNav } from "@/features/layout/sidebar-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/shared/ui/sidebar";
import { cn } from "@/shared/lib/utils";

/**
 * Reads the organization the current route is showing.
 *
 * The sidebar renders in the organization layout, so the slug has to come from
 * the deepest match rather than `useParams()`.
 */
function useRouteOrgSlug() {
  return useRouterState({
    select: (state) => {
      // Deepest match first: child params may or may not carry the parent's,
      // so scan rather than trusting only the leaf.
      for (let index = state.matches.length - 1; index >= 0; index -= 1) {
        const params = state.matches[index]?.params as { orgSlug?: string } | undefined;
        if (params?.orgSlug) return params.orgSlug;
      }
      return undefined;
    },
  });
}

/** The persistent navigation chrome: brand, sections and the account menu. */
export function AppSidebar() {
  const orgSlug = useRouteOrgSlug();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader
        className={cn(
          "relative px-4 py-6 group-data-[collapsible=icon]:items-center",
          "group-data-[collapsible=icon]:px-0",
        )}
      >
        <Logo variant="responsive" />
        <SidebarTrigger
          className={cn(
            "absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-opacity",
            "group-data-[collapsible=icon]:right-1/2 group-data-[collapsible=icon]:translate-x-1/2",
            "group-data-[state=collapsed]:opacity-0",
            "group-data-[state=collapsed]:group-hover:opacity-100",
          )}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav orgSlug={orgSlug} />
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:p-0">
        <AccountMenu orgSlug={orgSlug} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
