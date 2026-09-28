import { Loader2Icon } from "lucide-react";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { BrandedPage } from "@/features/layout/branded-page";
import { Button } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@/shared/ui/otp-field";
import { Skeleton } from "@/shared/ui/skeleton";
import { getSafeAuthRedirect } from "@/features/authentication/auth-redirect";

type AuthStage = "email" | "link-sent" | "code";

/**
 * Which action is awaiting its request.
 *
 * Tracked per action rather than as one shared boolean so a press on one button
 * cannot light up another button's pending spinner.
 */
type AuthAction = "google" | "magic-link" | "email-code" | "resend-link" | "resend-code" | "verify";

/** One transient feedback message, rendered by the app's toast provider. */
export type AuthenticationNotice = {
  type: "success" | "error";
  title: string;
  description?: string;
};

/** The auth operations the page invokes; the route owns the Better Auth adapter. */
export type AuthenticationServices = {
  sendMagicLink: (email: string, callbackURL: string, errorCallbackURL: string) => Promise<boolean>;
  sendCode: (email: string) => Promise<boolean>;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  signInWithGoogle: (callbackURL: string) => Promise<boolean>;
  finishCodeSignIn: (destination: string) => Promise<void>;
  notify: (notice: AuthenticationNotice) => void;
};

type AuthenticationPageProps = {
  redirect?: string;
  linkError?: string;
  config: {
    data?: {
      appName: string;
      magicLinkEnabled: boolean;
      emailOtpEnabled: boolean;
      socialProviders: { google: boolean };
    };
    isPending: boolean;
    isError: boolean;
  };
  services: AuthenticationServices;
};

/** Owns the passwordless sign-in flow shown at /auth/login. */
export function AuthenticationPage({
  redirect,
  linkError,
  config,
  services,
}: AuthenticationPageProps) {
  const { t } = useTranslation("auth");
  const [stage, setStage] = useState<AuthStage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pendingAction, setPendingAction] = useState<AuthAction | null>(null);
  const destination = getSafeAuthRedirect(redirect);
  const runtime = config.data;
  const emailEnabled = Boolean(runtime?.magicLinkEnabled || runtime?.emailOtpEnabled);
  const googleEnabled = Boolean(runtime?.socialProviders.google);
  const callbackURL = `${window.location.origin}${destination}`;
  const isBusy = pendingAction !== null;
  // "Continue" sends a link or a code depending on the instance's config, but it
  // is one button and therefore one action.
  const continueAction: AuthAction = runtime?.magicLinkEnabled ? "magic-link" : "email-code";

  // A failed magic-link verification redirects back here with `?error=`. The
  // toast fires once per failed link rather than on every render.
  useEffect(() => {
    if (!linkError) return;
    services.notify({ type: "error", title: t("linkExpired") });
  }, [linkError, services, t]);

  async function sendMagicLink(action: AuthAction) {
    setPendingAction(action);
    try {
      const errorCallbackURL = new URL("/auth/login", window.location.origin);
      errorCallbackURL.searchParams.set("redirect", destination);
      if (!(await services.sendMagicLink(email.trim(), callbackURL, errorCallbackURL.toString()))) {
        services.notify({ type: "error", title: t("authFailed") });
        return;
      }
      setStage("link-sent");
      services.notify({
        type: "success",
        title: t("linkSentToast"),
        description: t("checkInbox"),
      });
    } catch {
      services.notify({ type: "error", title: t("authFailed") });
    } finally {
      setPendingAction(null);
    }
  }

  async function sendCode(action: AuthAction) {
    setPendingAction(action);
    try {
      if (!(await services.sendCode(email.trim()))) {
        services.notify({ type: "error", title: t("authFailed") });
        return;
      }
      setCode("");
      setStage("code");
      services.notify({
        type: "success",
        title: t("codeSentToast"),
        description: email.trim(),
      });
    } catch {
      services.notify({ type: "error", title: t("authFailed") });
    } finally {
      setPendingAction(null);
    }
  }

  async function verifyCode() {
    setPendingAction("verify");
    try {
      if (!(await services.verifyCode(email.trim(), code.trim()))) {
        services.notify({ type: "error", title: t("invalidCode") });
        return;
      }
      await services.finishCodeSignIn(destination);
    } catch {
      services.notify({ type: "error", title: t("authFailed") });
    } finally {
      setPendingAction(null);
    }
  }

  async function signInWithGoogle() {
    setPendingAction("google");
    try {
      if (!(await services.signInWithGoogle(callbackURL))) {
        services.notify({ type: "error", title: t("authFailed") });
      }
    } catch {
      services.notify({ type: "error", title: t("authFailed") });
    } finally {
      setPendingAction(null);
    }
  }

  const validEmail = z.email().safeParse(email.trim()).success;

  return (
    <BrandedPage
      title={
        stage === "link-sent"
          ? t("linkSentTitle")
          : stage === "code"
            ? t("codeTitle")
            : t("loginTitle")
      }
      description={
        stage !== "email" ? (
          <>
            <p>{stage === "link-sent" ? t("linkSentDescription") : t("codeDescription")}</p>
            <p className="mt-1 inline-block max-w-full break-all rounded-sm bg-muted px-2.5 py-1 text-foreground text-sm">
              {email}
            </p>
          </>
        ) : null
      }
    >
      {config.isPending ? <AuthenticationOptionsSkeleton label={t("loadingMethods")} /> : null}
      {config.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {t("methodsUnavailable")}
        </p>
      ) : null}

      {!config.isPending && !config.isError && !emailEnabled && !googleEnabled ? (
        <output className="block border-t pt-5 text-sm text-muted-foreground">
          {t("signInUnavailable")}
        </output>
      ) : null}

      {!config.isPending && !config.isError && (emailEnabled || googleEnabled) ? (
        <div className="flex flex-col gap-6">
          {stage === "email" && googleEnabled ? (
            <>
              <PendingButton
                className="w-full"
                disabled={isBusy}
                icon={<GoogleMark />}
                onClick={() => void signInWithGoogle()}
                pending={pendingAction === "google"}
                size="lg"
                variant="secondary"
              >
                {t("continueWithGoogle")}
              </PendingButton>
              {emailEnabled ? (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>{t("or")}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              ) : null}
            </>
          ) : null}

          {stage === "email" && emailEnabled ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void (runtime?.magicLinkEnabled
                  ? sendMagicLink(continueAction)
                  : sendCode(continueAction));
              }}
            >
              <Field>
                <FieldLabel htmlFor="auth-email">{t("email")}</FieldLabel>
                <Input
                  id="auth-email"
                  autoComplete="email"
                  size="lg"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("emailPlaceholder")}
                />
              </Field>
              <PendingButton
                className="w-full"
                disabled={isBusy || !validEmail}
                pending={pendingAction === continueAction}
                size="lg"
                type="submit"
              >
                {t("continue")}
              </PendingButton>
              {runtime?.emailOtpEnabled ? (
                <button
                  className="self-center py-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  type="button"
                  disabled={isBusy || !validEmail}
                  onClick={() => void sendCode("email-code")}
                >
                  {t("emailMeCode")}
                </button>
              ) : null}
            </form>
          ) : null}

          {stage === "link-sent" ? (
            <div className="flex flex-col gap-5">
              <PendingButton
                className="w-full"
                disabled={isBusy || !runtime?.magicLinkEnabled}
                onClick={() => void sendMagicLink("resend-link")}
                pending={pendingAction === "resend-link"}
                size="lg"
                variant="outline"
              >
                {t("resendLink")}
              </PendingButton>
              <div className="flex items-center justify-between gap-4">
                {runtime?.emailOtpEnabled ? (
                  <button
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    type="button"
                    disabled={isBusy}
                    onClick={() => void sendCode("email-code")}
                  >
                    {t("useCodeInstead")}
                  </button>
                ) : null}
                <button
                  className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStage("email")}
                >
                  {t("changeEmail")}
                </button>
              </div>
            </div>
          ) : null}

          {stage === "code" ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void verifyCode();
              }}
            >
              <OTPField
                aria-label={t("verificationCode")}
                className="justify-center"
                length={6}
                onValueChange={setCode}
                size="lg"
                value={code}
              >
                <OTPFieldInput />
                <OTPFieldInput aria-label={t("otpDigit", { index: 2 })} />
                <OTPFieldInput aria-label={t("otpDigit", { index: 3 })} />
                <OTPFieldSeparator />
                <OTPFieldInput aria-label={t("otpDigit", { index: 4 })} />
                <OTPFieldInput aria-label={t("otpDigit", { index: 5 })} />
                <OTPFieldInput aria-label={t("otpDigit", { index: 6 })} />
              </OTPField>
              <PendingButton
                className="w-full"
                disabled={isBusy || code.length !== 6}
                pending={pendingAction === "verify"}
                size="lg"
                type="submit"
              >
                {t("verify")}
              </PendingButton>
              <div className="flex items-center justify-between gap-4 pt-1">
                <button
                  className="text-sm text-muted-foreground cursor-pointer underline-offset-4 hover:text-foreground hover:underline"
                  type="button"
                  disabled={isBusy || !runtime?.emailOtpEnabled}
                  onClick={() => void sendCode("resend-code")}
                >
                  {t("resendCode")}
                </button>
                <button
                  className="text-sm cursor-pointer text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStage("email")}
                >
                  {t("changeEmail")}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </BrandedPage>
  );
}

/**
 * Placeholder for the sign-in options while their runtime flags load.
 *
 * Mirrors the final geometry (social button, divider, field, submit) so the
 * real controls drop in without shifting the layout.
 */
function AuthenticationOptionsSkeleton({ label }: { label: string }) {
  return (
    <output aria-label={label} className="flex flex-col gap-6">
      <Skeleton className="h-10 w-full sm:h-9" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-px flex-1" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-9.5 w-full rounded-lg sm:h-8.5" />
      </div>
      <Skeleton className="h-10 w-full sm:h-9" />
    </output>
  );
}

/**
 * A button that keeps its label readable while a request is in flight.
 *
 * `Button`'s own `loading` prop hides the label behind a centred spinner, which
 * reads as an empty button for a passwordless sign-in where the label is the
 * only cue about what is happening. The spinner here is decorative: it must not
 * join the button's accessible name (the shared `Spinner` announces itself), so
 * the label plus the disabled state carry the pending meaning on their own.
 */
function PendingButton({
  pending,
  icon,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pending: boolean; icon?: ReactNode }) {
  return (
    <Button disabled={pending || disabled} {...props}>
      {pending ? (
        <Loader2Icon
          aria-hidden="true"
          className="size-4 animate-spin"
          data-slot="auth-pending-indicator"
        />
      ) : (
        icon
      )}
      <span>{children}</span>
    </Button>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.05 5.05 0 0 1-2.2 3.31v2.77h3.57c2.09-1.92 3.27-4.75 3.27-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.28-1.93-6.15-4.53H2.16v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.16a11 11 0 0 0 0 9.88l3.69-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.54 10.54 0 0 0 12 1a11 11 0 0 0-9.84 6.06l3.69 2.84C6.72 7.29 9.14 5.36 12 5.36Z"
      />
    </svg>
  );
}
