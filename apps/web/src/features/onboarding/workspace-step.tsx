import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useAppForm } from "@/shared/forms";
import PageTitle from "@/shared/ui/page-title";
import { Spinner } from "@/shared/ui/spinner";
import { toastManager } from "@/shared/ui/toast";
import { useCreateWorkspace } from "@/features/workspaces/hooks/use-create-workspace";
import { refreshSession } from "@/features/authentication/hooks/use-session";
import type { OnboardingNavigationConfig } from "@/features/onboarding/onboarding";
import { OnboardingFrame } from "./onboarding-frame";

type CreatedWorkspace = { name: string; slug: string };

/** Long enough to read the confirmation, short enough not to feel stuck. */
const REDIRECT_DELAY_MS = 1200;

/**
 * Final onboarding step: create the workspace setup lands the user in.
 *
 * The server marks onboarding complete from the organization hook, so this step
 * only has to refresh the session before it navigates — otherwise the workspace
 * guard would still be reading the pre-creation step. The redirect uses the slug
 * from the response rather than the session's active organization, which the
 * browser has not necessarily refetched.
 */
export function WorkspaceStep({ navigation }: { navigation?: OnboardingNavigationConfig }) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createWorkspace = useCreateWorkspace();

  const [created, setCreated] = useState<CreatedWorkspace | null>(null);

  useEffect(() => {
    if (!created) return;

    const timer = setTimeout(() => {
      void navigate({
        to: "/$orgSlug",
        params: { orgSlug: created.slug },
        replace: true,
      });
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [created, navigate]);

  const form = useAppForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      try {
        const workspace = await createWorkspace.mutateAsync({ name: value.name.trim() });

        await refreshSession(queryClient);
        setCreated({ name: workspace.name, slug: workspace.slug });
      } catch {
        // A server message is not a stable localized UI contract, and a toast
        // matches how the login page reports a failed request.
        toastManager.add({ type: "error", title: t("onboarding.createFailed") });
      }
    },
    validators: {
      onSubmit: z.object({
        name: z.string().trim().min(1, t("onboarding.validation.workspaceNameRequired")),
      }),
    },
  });

  if (created) {
    return (
      <>
        <PageTitle title={t("onboarding.pageTitle")} />
        <OnboardingFrame
          current="workspace"
          title={t("onboarding.createdTitle")}
          description={t("onboarding.redirecting", { name: created.name })}
          navigation={navigation}
        >
          <div className="flex justify-center">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        </OnboardingFrame>
      </>
    );
  }

  return (
    <>
      <PageTitle title={t("onboarding.pageTitle")} />
      <OnboardingFrame
        current="workspace"
        title={t("onboarding.title")}
        description={t("onboarding.subtitle")}
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
                label={t("onboarding.workspaceName")}
                placeholder={t("onboarding.workspaceNamePlaceholder")}
                size="lg"
              />
            )}
          </form.AppField>

          <form.AppForm>
            <form.SubmitButton className="w-full" size="lg">
              {t("onboarding.createWorkspace")}
            </form.SubmitButton>
          </form.AppForm>
        </form>
      </OnboardingFrame>
    </>
  );
}

export default WorkspaceStep;
