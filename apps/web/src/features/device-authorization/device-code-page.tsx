import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandedPage } from "@/features/layout/branded-page";
import { Button } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { toastManager } from "@/shared/ui/toast";
import { authClient } from "@/shared/auth/auth-client";
import {
  deviceErrorDescription,
  isSubmittableUserCode,
  normalizeUserCode,
} from "@/features/device-authorization/device-code";

/**
 * The first half of the device flow: enter the code a CLI or app is showing.
 *
 * The code is checked against the API here rather than on the next screen, so a
 * mistyped, expired, or already-used code is reported where it was typed. The
 * check is also what claims the code for the signed-in user, which Better Auth
 * requires before the approve endpoint will accept it — by the time the user
 * reaches the approval screen, the request is already theirs.
 */
export function DeviceCodePage({ codeFromLink }: { codeFromLink?: string }) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  // `verification_uri_complete` carries the code, so arriving from a CLI
  // prefills the field and the user only has to press Continue.
  const [code, setCode] = useState(codeFromLink ?? "");
  const [checking, setChecking] = useState(false);

  const normalized = normalizeUserCode(code);
  const canSubmit = isSubmittableUserCode(normalized) && !checking;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setChecking(true);
    try {
      const result = await authClient.device({ query: { user_code: normalized } });

      if (result.error) {
        toastManager.add({
          type: "error",
          title: t("device.invalidCode"),
          // The plugin's own description says *why* (expired, already used);
          // the headline stays translated.
          description: deviceErrorDescription(result.error) ?? undefined,
        });
        return;
      }

      await navigate({ to: "/device/approve", search: { user_code: normalized } });
    } catch {
      toastManager.add({ type: "error", title: t("device.invalidCode") });
    } finally {
      setChecking(false);
    }
  }

  return (
    <BrandedPage title={t("device.title")} description={t("device.subtitle")}>
      <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <Field>
          <FieldLabel htmlFor="device-code">{t("device.codeLabel")}</FieldLabel>
          <Input
            id="device-code"
            autoCapitalize="characters"
            autoComplete="one-time-code"
            autoCorrect="off"
            className="text-center font-mono tracking-[0.2em]"
            placeholder={t("device.codePlaceholder")}
            size="lg"
            spellCheck={false}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </Field>

        <Button className="w-full" disabled={!canSubmit} loading={checking} size="lg" type="submit">
          {t("continue")}
        </Button>
      </form>
    </BrandedPage>
  );
}
