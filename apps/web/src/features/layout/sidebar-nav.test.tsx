import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppI18nProvider } from "@/shared/i18n/provider";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { SidebarNav } from "./sidebar-nav";

function renderNavigation(initialEntry: string) {
  const root = createRootRoute({ component: Outlet });
  const workspace = createRoute({
    getParentRoute: () => root,
    path: "/$orgSlug",
    component: () => <SidebarNav orgSlug="acme" />,
  });
  const members = createRoute({
    getParentRoute: () => workspace,
    path: "/members",
    component: () => null,
  });
  const router = createRouter({
    routeTree: root.addChildren([workspace.addChildren([members])]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AppI18nProvider>
        <SidebarProvider>
          <RouterProvider router={router} />
        </SidebarProvider>
      </AppI18nProvider>
    </QueryClientProvider>,
  );
}

describe("workspace sidebar navigation", () => {
  it("shows a Members link for the active workspace", async () => {
    renderNavigation("/acme/members");

    expect(await screen.findByRole("link", { name: "Members" })).toHaveAttribute(
      "href",
      "/acme/members",
    );
  });
});
