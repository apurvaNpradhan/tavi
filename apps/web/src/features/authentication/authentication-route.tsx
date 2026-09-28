import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AuthenticationPage,
  type AuthenticationServices,
} from "@/features/authentication/authentication-page";
import { toastManager } from "@/shared/ui/toast";
import { refreshSession } from "@/features/authentication/hooks/use-session";
import { orpc } from "@/shared/api/api-client";
import { authClient } from "@/shared/auth/auth-client";

/** Wires the login page to the typed runtime config and Better Auth client. */
export function AuthenticationRoute({
  redirect,
  linkError,
}: {
  redirect?: string;
  linkError?: string;
}) {
  const config = useQuery(orpc.config.get.queryOptions());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const services: AuthenticationServices = {
    sendMagicLink: async (email, callbackURL, errorCallbackURL) => {
      const result = await authClient.signIn.magicLink({ email, callbackURL, errorCallbackURL });
      return !result.error;
    },
    sendCode: async (email) => {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
      return !result.error;
    },
    verifyCode: async (email, otp) => {
      const result = await authClient.signIn.emailOtp({ email, otp });
      return !result.error;
    },
    signInWithGoogle: async (callbackURL) => {
      const result = await authClient.signIn.social({ provider: "google", callbackURL });
      return !result.error;
    },
    finishCodeSignIn: async (destination) => {
      // Force a fresh read so the guard and the login gate see the new session
      // before navigation resolves the user's active workspace.
      await refreshSession(queryClient);
      await navigate({ to: destination });
    },
    notify: (notice) => {
      toastManager.add(notice);
    },
  };

  return (
    <AuthenticationPage
      redirect={redirect}
      linkError={linkError}
      config={config}
      services={services}
    />
  );
}
