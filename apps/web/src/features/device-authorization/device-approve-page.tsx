import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandedPage } from "@/features/layout/branded-page";
import { Button } from "@/shared/ui/button";
import { toastManager } from "@/shared/ui/toast";
import { useAppSession } from "@/features/authentication/hooks/use-session";
import { authClient } from "@/shared/auth/auth-client";
import {
  deviceErrorDescription,
  normalizeUserCode,
} from "@/features/device-authorization/device-code";

/** Which button is mid-request, so one press cannot light up the other. */
type Decision = "approve" | "deny";

/**
 * The second half of the device flow: approve or deny the waiting client.
 *
 * Approving connects a CLI or app to this account, so the screen names the code
 * being decided and offers both answers. Denying is a first-class action rather
 * than a dismissal: a code the user did not ask for should be cancelled, not
 * left pending until it expires.
 */
export function DeviceApprovePage({ codeFromLink }: { codeFromLink?: string }) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { data: session, isPending } = useAppSession();
  const [deciding, setDeciding] = useState<Decision | null>(null);

  const code = normalizeUserCode(codeFromLink);

  async function decide(decision: Decision) {
    setDeciding(decision);
    try {
      // Claim the code for this user before deciding on it. Better Auth only
      // accepts a decision from the session that claimed the code, and the claim
      // is idempotent, so a failure here is not reported: the decision below
      // fails with a specific reason if the claim was what went wrong.
      await authClient.device({ query: { user_code: code } });

      const result =
        decision === "approve"
          ? await authClient.device.approve({ userCode: code })
          : await authClient.device.deny({ userCode: code });

      if (result.error) {
        toastManager.add({
          type: "error",
          title: decision === "approve" ? t("device.approveFailed") : t("device.denyFailed"),
          description: deviceErrorDescription(result.error) ?? undefined,
        });
        return;
      }

      toastManager.add({
        type: "success",
        title: decision === "approve" ? t("device.approved") : t("device.denied"),
      });

      // `/` resolves the onboarding step and the default workspace, so the
      // destination stays correct without repeating that logic here.
      await navigate({ to: "/" });
    } catch {
      toastManager.add({
        type: "error",
        title: decision === "approve" ? t("device.approveFailed") : t("device.denyFailed"),
      });
    } finally {
      setDeciding(null);
    }
  }

  if (isPending) {
    return (
      <BrandedPage title={t("device.approveTitle")} description={t("device.loading")}>
        <span />
      </BrandedPage>
    );
  }

  // The session is required to record who a device is being connected to, so an
  // anonymous visitor signs in first and returns to this exact code.
  if (!session) {
    return (
      <BrandedPage title={t("device.approveTitle")} description={t("device.signInPrompt")}>
        <Button
          className="w-full"
          size="lg"
          onClick={() =>
            void navigate({
              to: "/auth/login",
              search: { redirect: `/device/approve?user_code=${encodeURIComponent(code)}` },
            })
          }
        >
          {t("signIn")}
        </Button>
      </BrandedPage>
    );
  }

  if (!code) {
    return (
      <BrandedPage title={t("device.approveTitle")} description={t("device.noCode")}>
        <Button
          className="w-full"
          size="lg"
          variant="secondary"
          onClick={() => void navigate({ to: "/device" })}
        >
          {t("device.enterCode")}
        </Button>
      </BrandedPage>
    );
  }

  return (
    <BrandedPage title={t("device.approveTitle")} description={t("device.approveSubtitle")}>
      <div className="flex flex-col gap-4">
        <p className="text-center font-mono text-sm tracking-[0.2em]">{code}</p>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={deciding !== null}
            loading={deciding === "approve"}
            size="lg"
            onClick={() => void decide("approve")}
          >
            {t("device.approve")}
          </Button>
          <Button
            disabled={deciding !== null}
            loading={deciding === "deny"}
            size="lg"
            variant="outline"
            onClick={() => void decide("deny")}
          >
            {t("device.deny")}
          </Button>
        </div>
      </div>
    </BrandedPage>
  );
}
