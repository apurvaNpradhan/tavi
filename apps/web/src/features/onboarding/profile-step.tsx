import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useAppForm } from "@/shared/forms";
import PageTitle from "@/shared/ui/page-title";
import { useAuth } from "@/shared/providers/auth-provider/hooks/use-auth";
import { toastManager } from "@/shared/ui/toast";
import { refreshSession } from "@/features/authentication/hooks/use-session";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";
import { authClient } from "@/shared/auth/auth-client";
import type { OnboardingNavigationConfig } from "@/features/onboarding/onboarding";
import { OnboardingFrame } from "./onboarding-frame";

/** Collects a user's name before the workspace step. */
export function ProfileStep({ navigation }: { navigation?: OnboardingNavigationConfig }) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: workspaces } = useWorkspaces();
  const form = useAppForm({
    defaultValues: { name: user?.name ?? "" },
    onSubmit: async ({ value }) => {
      try {
        // Invited users already have a workspace, so they can finish setup here.
        const nextStep = (workspaces?.length ?? 0) > 0 ? "completed" : "workspace";
        const { error } = await authClient.updateUser({
          name: value.name.trim(),
          onboardingStep: nextStep,
        });

        if (error) throw new Error(error.message);

        await refreshSession(queryClient);
        await navigate({ to: nextStep === "completed" ? "/" : "/onboarding/workspace" });
      } catch {
        toastManager.add({ type: "error", title: t("onboarding.profileFailed") });
      }
    },
    validators: {
      onSubmit: z.object({
        name: z.string().trim().min(2, t("onboarding.validation.nameTooShort")),
      }),
    },
  });

  return (
    <>
      <PageTitle title={t("onboarding.pageTitle")} />
      <OnboardingFrame
        current="profile"
        title={t("onboarding.profileTitle")}
        navigation={navigation}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label={t("onboarding.name")}
                placeholder={t("onboarding.namePlaceholder")}
                size="lg"
                autoComplete="name"
              />
            )}
          </form.AppField>

          <form.AppForm>
            <form.SubmitButton className="w-full" size="lg">
              {t("onboarding.profileContinue")}
            </form.SubmitButton>
          </form.AppForm>
        </form>
      </OnboardingFrame>
    </>
  );
}

export default ProfileStep;
