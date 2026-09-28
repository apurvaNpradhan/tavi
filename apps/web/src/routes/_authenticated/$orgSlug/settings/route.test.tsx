import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppI18nProvider } from "@/shared/i18n/provider";
import { createSettingsOpenState } from "@/features/settings/settings-navigation";
import { Route as SettingsRoute } from "./route";

function SettingsOpenLink() {
  return (
    <Link to="/$orgSlug/settings" params={{ orgSlug: "acme" }} state={createSettingsOpenState}>
      Open settings
    </Link>
  );
}

function createSettingsRouter(initialEntries: string[]) {
  const root = createRootRoute({ component: Outlet });
  const organization = createRoute({
    getParentRoute: () => root,
    path: "/$orgSlug",
    component: Outlet,
  });
  const home = createRoute({
    getParentRoute: () => organization,
    path: "/",
    component: SettingsOpenLink,
  });
  const members = createRoute({
    getParentRoute: () => organization,
    path: "/members",
    component: SettingsOpenLink,
  });
  // SAFETY: the file-route generic hides the runtime update options the generated
  // route tree uses. This test attaches the same route to an isolated tree.
  const settings = SettingsRoute.update({
    id: "/settings",
    path: "/settings",
    getParentRoute: () => organization,
  } as Parameters<typeof SettingsRoute.update>[0]);
  const profile = createRoute({
    getParentRoute: () => settings,
    path: "/",
    component: () => <div>Profile section</div>,
  });
  const appearance = createRoute({
    getParentRoute: () => settings,
    path: "/appearance",
    component: () => <div>Appearance section</div>,
  });
  const sessions = createRoute({
    getParentRoute: () => settings,
    path: "/sessions",
    component: () => <div>Sessions section</div>,
  });
  const router = createRouter({
    routeTree: root.addChildren([
      organization.addChildren([
        home,
        members,
        settings.addChildren([profile, appearance, sessions]),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries }),
  });
  return router;
}

describe("settings dialog navigation", () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    // jsdom omits scrollTo; the router calls it after navigation.
    window.scrollTo = () => {};
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    document.body.style.pointerEvents = "";
  });

  it("closes to the page opened from, skipping visited sections", async () => {
    const router = createSettingsRouter(["/acme/members?from=origin"]);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AppI18nProvider>
          <RouterProvider router={router} />
        </AppI18nProvider>
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("link", { name: "Open settings" }));
    await screen.findByText("Profile section");
    fireEvent.click(screen.getByRole("link", { name: "Appearance" }));
    await screen.findByText("Appearance section");
    fireEvent.click(screen.getByRole("link", { name: "Sessions and devices" }));
    await screen.findByText("Sessions section");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(router.state.location.href).toBe("/acme/members?from=origin"));
  });

  it("keeps the opening page if the settings layout remounts between sections", async () => {
    const router = createSettingsRouter(["/acme/members?from=origin"]);
    const renderRouter = () =>
      render(
        <QueryClientProvider client={new QueryClient()}>
          <AppI18nProvider>
            <RouterProvider router={router} />
          </AppI18nProvider>
        </QueryClientProvider>,
      );
    const firstMount = renderRouter();
    fireEvent.click(await screen.findByRole("link", { name: "Open settings" }));
    await screen.findByText("Profile section");
    fireEvent.click(screen.getByRole("link", { name: "Sessions and devices" }));
    await screen.findByText("Sessions section");

    firstMount.unmount();
    renderRouter();
    await screen.findByText("Sessions section");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(router.state.location.href).toBe("/acme/members?from=origin"));
  });

  it("falls back to workspace home after a refresh on a settings section", async () => {
    // A browser refresh preserves history entries, but remounts the layout.
    // Its immediate predecessor is a settings section, not the origin page.
    const router = createSettingsRouter([
      "/acme?from=origin",
      "/acme/settings",
      "/acme/settings/sessions",
    ]);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AppI18nProvider>
          <RouterProvider router={router} />
        </AppI18nProvider>
      </QueryClientProvider>,
    );
    await screen.findByText("Sessions section");
    fireEvent.click(screen.getByRole("link", { name: "Appearance" }));
    await screen.findByText("Appearance section");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(router.state.location.href).toBe("/acme"));
  });

  it("does not trust an origin marker persisted by a previous page load", async () => {
    const router = createSettingsRouter(["/acme?from=origin", "/acme/settings/sessions"]);
    router.history.replace("/acme/settings/sessions", {
      settingsOrigin: { pageLoadId: "previous-page-load", historyIndex: 0 },
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AppI18nProvider>
          <RouterProvider router={router} />
        </AppI18nProvider>
      </QueryClientProvider>,
    );
    await screen.findByText("Sessions section");
    fireEvent.click(screen.getByRole("link", { name: "Appearance" }));
    await screen.findByText("Appearance section");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(router.state.location.href).toBe("/acme"));
  });

  it("closes a directly loaded settings URL to workspace home", async () => {
    const router = createSettingsRouter(["/acme/settings/sessions"]);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AppI18nProvider>
          <RouterProvider router={router} />
        </AppI18nProvider>
      </QueryClientProvider>,
    );
    await screen.findByText("Sessions section");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(router.state.location.href).toBe("/acme"));
  });
});
