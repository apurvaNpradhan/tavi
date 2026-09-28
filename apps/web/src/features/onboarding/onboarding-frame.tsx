import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BrandedPage } from "@/features/layout/branded-page";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/shared/providers/auth-provider/hooks/use-auth";
import {
  isOnboardingActionAvailable,
  toOnboardingStep,
  type OnboardingNavigationConfig,
} from "@/features/onboarding/onboarding";
import { cn } from "@/shared/lib/utils";

/** The steps a user walks through, in order. */
const STEPS = ["profile", "workspace"] as const;

export type OnboardingStepName = (typeof STEPS)[number];

type OnboardingFrameProps = {
  /** Which step is being shown, which is what the indicator reports. */
  current: OnboardingStepName;
  title: string;
  description?: ReactNode;
  /** Route-owned controls; unavailable actions are omitted from the UI. */
  navigation?: OnboardingNavigationConfig;
  children: ReactNode;
};

/**
 * The chrome shared by every onboarding step.
 *
 * Setup is more than one screen, so the quiet progress indicator belongs to the
 * frame rather than each step and cannot drift when the step list changes.
 */
export function OnboardingFrame({
  current,
  title,
  description,
  navigation,
  children,
}: OnboardingFrameProps) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { user } = useAuth();
  const storedStep = toOnboardingStep(user?.onboardingStep);
  const currentIndex = STEPS.indexOf(current);
  const back = isOnboardingActionAvailable(navigation?.back, storedStep)
    ? navigation?.back
    : undefined;
  const skip = isOnboardingActionAvailable(navigation?.skip, storedStep)
    ? navigation?.skip
    : undefined;

  const progressDots = (
    <ol
      aria-label={t("onboarding.progress", {
        current: currentIndex + 1,
        total: STEPS.length,
      })}
      className="flex items-center justify-center gap-2"
    >
      {STEPS.map((step, index) => (
        <li key={step} aria-current={index === currentIndex ? "step" : undefined}>
          <span
            aria-hidden="true"
            className={cn(
              "block size-1.5 rounded-full",
              index <= currentIndex ? "bg-primary" : "bg-muted",
            )}
          />
          <span className="sr-only">
            {t("onboarding.stepName", { current: index + 1, total: STEPS.length })}
          </span>
        </li>
      ))}
    </ol>
  );

  const headerContent = (
    <nav
      aria-label={t("onboarding.navigation")}
      className="grid grid-cols-[1fr_auto_1fr] items-center"
    >
      <div>
        {back ? (
          <Button
            aria-label={t("onboarding.back")}
            onClick={() => void navigate({ to: back.target })}
            size="sm"
            type="button"
            variant="ghost"
          >
            <ChevronLeftIcon aria-hidden="true" />
            {t("onboarding.back")}
          </Button>
        ) : null}
      </div>
      {progressDots}
      <div className="flex justify-end">
        {skip ? (
          <Button
            aria-label={t("onboarding.skip")}
            onClick={() => void navigate({ to: skip.target })}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("onboarding.skip")}
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </nav>
  );

  return (
    <BrandedPage
      brandMark={false}
      header={false}
      headerContent={headerContent}
      title={title}
      description={description}
    >
      {children}
    </BrandedPage>
  );
}

export default OnboardingFrame;
