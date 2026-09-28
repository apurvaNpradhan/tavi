import { Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

/** Renders the persistent sidebar and header around organization routes. */
export function OrganizationLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="rounded-2xl">
        <div className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
