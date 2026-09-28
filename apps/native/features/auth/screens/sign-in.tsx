import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Button, Field, Input, KeyboardAvoider, OtpInput, Text } from "panelui-native";
import { ChevronLeftIcon } from "panelui-native/icons";
import { GoogleSignInButton } from "../components/google-sign-in-button";
import { useAuthConfig } from "../components/use-auth-config";
import { useRefreshSession } from "../components/use-refresh-session";
import { authClient } from "../auth-client";

type SignInStage = "email" | "code";
type PendingAction = "send" | "resend" | "verify";

const RESEND_COOLDOWN_SECONDS = 30;
const CODE_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Passwordless email sign-in.
 *
 * A code is requested for the address, verified with Better Auth's email OTP
 * endpoint, and the session query is refreshed so the root `Stack.Protected`
 * guard moves the user on. This screen never navigates the user itself.
 */
export default function SignInScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const refreshSession = useRefreshSession();
  const { config, emailEnabled, googleEnabled } = useAuthConfig();

  const [stage, setStage] = useState<SignInStage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const trimmedEmail = email.trim();
  const busy = pendingAction !== null;
  const somethingEnabled = emailEnabled || googleEnabled;

  // One timeout per remaining second keeps the label honest without a shared
  // interval that keeps ticking after the screen is gone.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)");
  }

  function changeEmail() {
    setStage("email");
    setCode("");
    setCooldown(0);
    setEmailError(null);
    setRequestError(null);
  }

  async function sendCode(action: "send" | "resend") {
    if (busy) return;
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError(t("auth:emailInvalid"));
      return;
    }
    setPendingAction(action);
    setEmailError(null);
    setRequestError(null);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: trimmedEmail,
        type: "sign-in",
      });
      if (result.error) throw new Error(result.error.message);
      setCode("");
      setStage("code");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setRequestError(t("auth:authFailed"));
    } finally {
      setPendingAction(null);
    }
  }

  async function verifyCode(otp: string) {
    if (busy || otp.length !== CODE_LENGTH) return;
    setPendingAction("verify");
    setRequestError(null);
    try {
      const result = await authClient.signIn.emailOtp({ email: trimmedEmail, otp });
      if (result.error) throw new Error(result.error.message);
      await refreshSession();
    } catch {
      setRequestError(t("auth:invalidCode"));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="px-3 pt-2">
        <Button
          size="icon"
          variant="ghost"
          accessibilityLabel={t("auth:back")}
          disabled={busy}
          onPress={goBack}
        >
          <ChevronLeftIcon size={20} />
        </Button>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="grow justify-center px-6 pb-10"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="mx-auto w-full max-w-md gap-6">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              {stage === "email" ? t("auth:signIn") : t("auth:codeTitle")}
            </Text>
            <Text className="font-normal text-base text-muted-foreground">
              {stage === "email" ? t("auth:signInSubtitle") : t("auth:codeDescription")}
            </Text>
            {stage === "code" ? (
              <Text className="text-base font-medium text-foreground">{trimmedEmail}</Text>
            ) : null}
          </View>

          {config.isPending ? (
            <ActivityIndicator accessibilityLabel={t("auth:loadingMethods")} />
          ) : null}

          {config.isError ? (
            <View className="gap-3">
              <Text className="font-normal text-destructive" accessibilityRole="alert">
                {t("auth:methodsUnavailable")}
              </Text>
              <Button variant="outline" onPress={() => void config.refetch()}>
                {t("common:retry")}
              </Button>
            </View>
          ) : null}

          {!config.isPending && !config.isError && !somethingEnabled ? (
            <Text className="font-normal text-muted-foreground">{t("auth:signInUnavailable")}</Text>
          ) : null}

          {!config.isPending && !config.isError && somethingEnabled && stage === "email" ? (
            <View className="gap-5">
              {googleEnabled ? (
                <GoogleSignInButton disabled={busy} onError={setRequestError} />
              ) : null}
              {googleEnabled && emailEnabled ? (
                <Field.Separator>{t("auth:or")}</Field.Separator>
              ) : null}
              {emailEnabled ? (
                <View className="gap-4">
                  <Input
                    label={t("auth:email")}
                    placeholder={t("auth:emailPlaceholder")}
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (emailError) setEmailError(null);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    editable={!busy}
                    avoidKeyboard
                    errorMessage={emailError ?? undefined}
                  />
                  <Button
                    fullWidth
                    loading={pendingAction === "send"}
                    disabled={busy || trimmedEmail.length === 0}
                    onPress={() => void sendCode("send")}
                  >
                    {t("auth:continue")}
                  </Button>
                </View>
              ) : null}
              {requestError ? (
                <Text className="font-normal text-destructive" accessibilityRole="alert">
                  {requestError}
                </Text>
              ) : null}
            </View>
          ) : null}

          {!config.isPending && !config.isError && somethingEnabled && stage === "code" ? (
            <KeyboardAvoider active className="gap-5">
              <OtpInput
                accessibilityLabel={t("auth:verificationCode")}
                value={code}
                onChangeText={setCode}
                length={CODE_LENGTH}
                type="numeric"
                autoComplete="one-time-code"
                editable={!busy}
                isInvalid={Boolean(requestError)}
                onComplete={(value) => void verifyCode(value)}
              />
              {requestError ? (
                <Text className="font-normal text-destructive" accessibilityRole="alert">
                  {requestError}
                </Text>
              ) : null}
              <Button
                fullWidth
                loading={pendingAction === "verify"}
                disabled={code.length !== CODE_LENGTH || busy}
                onPress={() => void verifyCode(code)}
              >
                {t("auth:verify")}
              </Button>
              <View className="gap-2">
                <Button
                  variant="ghost"
                  loading={pendingAction === "resend"}
                  disabled={busy || cooldown > 0}
                  onPress={() => void sendCode("resend")}
                >
                  {cooldown > 0 ? t("auth:resendIn", { seconds: cooldown }) : t("auth:resendCode")}
                </Button>
                <Button variant="ghost" disabled={busy} onPress={changeEmail}>
                  {t("auth:changeEmail")}
                </Button>
              </View>
            </KeyboardAvoider>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
