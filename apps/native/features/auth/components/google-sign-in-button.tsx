import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "panelui-native";
import { GoogleIcon } from "panelui-native/icons";
import { authClient } from "../auth-client";
import { useRefreshSession } from "./use-refresh-session";

type GoogleSignInButtonProps = {
  /** Disable while another sign-in action is already running. */
  disabled?: boolean;
  /** Reports a failed attempt, or null when a new attempt starts. */
  onError: (message: string | null) => void;
};

/**
 * Google OAuth sign-in for the signed-out screens.
 *
 * Better Auth's Expo client opens the provider in a browser session and stores
 * the resulting cookie; a successful attempt then refreshes the session query
 * so the root guard moves the user on without any navigation here.
 */
export function GoogleSignInButton({ disabled = false, onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation("auth");
  const refreshSession = useRefreshSession();
  const [pending, setPending] = useState(false);

  async function handlePress() {
    setPending(true);
    onError(null);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "tavi://",
      });
      if (result.error) throw new Error(result.error.message);
      await refreshSession();
    } catch {
      onError(t("authFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="social"
      fullWidth
      loading={pending}
      disabled={disabled || pending}
      startContent={<GoogleIcon size={18} />}
      onPress={() => void handlePress()}
    >
      {t("continueWithGoogle")}
    </Button>
  );
}
