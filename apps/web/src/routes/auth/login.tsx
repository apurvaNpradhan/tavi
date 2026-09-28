import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AuthenticationRoute } from "@/features/authentication/authentication-route";
import { sessionQueryOptions } from "@/features/authentication/hooks/use-session";

export const Route = createFileRoute("/auth/login")({
  validateSearch: z.object({ redirect: z.string().optional(), error: z.string().optional() }),
  beforeLoad: async ({ context, search }) => {
    // The session is read before the notice checks below: a user who is already
    // signed in must never be parked on this page just because they arrived
    // with `?error=` or `?redirect=`, which is exactly how a route guard sends
    // them here. Without this ordering, a reload keeps them on the form.
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());

    if (session) {
      // A signed-in user is handed to the `/` resolver, which lands them on
      // their active workspace — or first-run setup — instead of leaving them
      // on this form. A stale active workspace is corrected there.
      throw redirect({ to: "/" });
    }

    // Signed out: an error notice must stay visible, and an explicit redirect
    // target means the caller already decided where to go after signing in.
    if (search.error || search.redirect) return;
  },
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect: redirectAfterSignIn, error } = Route.useSearch();
  return <AuthenticationRoute redirect={redirectAfterSignIn} linkError={error} />;
}
