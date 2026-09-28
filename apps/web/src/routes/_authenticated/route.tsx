import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/features/authentication/hooks/use-session";

/**
 * The authentication gate for every child route.
 *
 * The auth provider already populated this cache entry, so the guard reads it
 * from the shared query cache instead of issuing a second `getSession()`. A
 * request that throws rejects the guard and surfaces the router error
 * boundary; only a definitive `null` session redirects to sign-in.
 */
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());

    if (!session) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.href },
      });
    }

    return { session };
  },
  component: () => (
    <div className="min-h-svh bg-background">
      <Outlet />
    </div>
  ),
});
