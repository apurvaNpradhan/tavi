import { a11yDevtoolsPlugin } from "@tanstack/devtools-a11y/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import ErrorComponent from "@/shared/ui/error-component";
import NotFound from "@/shared/ui/not-found";

export type RouterContext = {
  queryClient: QueryClient;
  user: { id: string } | null | undefined;
};

/**
 * The root route carries router context (the query client and the current
 * user) and renders an outlet plus the DEV-only TanStack devtools. The app
 * shell lives in `_authenticated` so the auth pages stay outside it; the
 * devtools render branch is stripped from production bundles by Vite's
 * dead-code elimination of `import.meta.env.DEV`.
 */
export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && (
        <TanStackDevtools
          plugins={[
            { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
            { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel /> },
            a11yDevtoolsPlugin(),
          ]}
        />
      )}
    </>
  ),
  notFoundComponent: () => <NotFound />,
  errorComponent: () => <ErrorComponent />,
});
