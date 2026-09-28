import "./instrument";

import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AuthProvider from "@/shared/providers/auth-provider";
import { useAuth } from "@/shared/providers/auth-provider/hooks/use-auth";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { ToastProvider } from "@/shared/ui/toast";
import { AppI18nProvider, i18nReady } from "@/shared/i18n/provider";
import queryClient from "@/shared/query-client";
import { routeTree } from "./routeTree.gen";
import "@/index.css";

const router = createRouter({
  routeTree,
  // Preload a route's code when the user shows intent (hover/focus), which
  // makes navigation feel instant without prefetching everything.
  defaultPreload: "intent",
  // Always run a route's loader when the user shows intent: without this a
  // preload older than the default window is treated as fresh and the
  // navigation waits for the request it should have already made.
  defaultPreloadStaleTime: 0,
  context: { user: null, queryClient },
});

function App() {
  const { user } = useAuth();
  return <RouterProvider router={router} context={{ user }} />;
}

function render() {
  const rootElement = document.getElementById("root");
  if (!rootElement || rootElement.innerHTML) return;

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppI18nProvider>
            <ToastProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ToastProvider>
          </AppI18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

// Common copy is bundled; initialization should not need a network request.
// Show a visible failure rather than leaving an empty root if it rejects.
void i18nReady.then(render, () => {
  const rootElement = document.getElementById("root");
  if (rootElement) rootElement.textContent = "Could not start the application. Please reload.";
});
