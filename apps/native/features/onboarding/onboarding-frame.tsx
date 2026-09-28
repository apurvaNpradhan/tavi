import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Button, Text } from "panelui-native";
import { ChevronLeftIcon, XIcon } from "panelui-native/icons";

/**
 * The onboarding steps, in order.
 *
 * Mirrors `apps/web/src/features/onboarding/onboarding-frame.tsx`, so the two
 * clients report the same progress for the same account.
 */
export const ONBOARDING_STEPS = ["profile", "workspace"] as const;

export type OnboardingStepName = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingFrameProps {
  /** Which step is being shown, which is what the progress bar reports. */
  current: OnboardingStepName;
  /** The question the step asks, e.g. "What's your name?". */
  title: string;
  /** Omitted on the first step, where there is nowhere to go back to. */
  onBack?: () => void;
  /** Leaves setup from the top-right control. */
  onSkip?: () => void;
  /** Accessible name for the skip control, when it is not literally "Skip". */
  skipLabel?: string;
  /** Disables back and skip while an action is in flight. */
  busy?: boolean;
  /** The one action the step is built around. */
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  children: ReactNode;
}

/** Reports how far through setup the user is, one segment per step. */
function OnboardingProgress({ current }: { current: OnboardingStepName }) {
  const { t } = useTranslation("auth");
  const currentIndex = ONBOARDING_STEPS.indexOf(current);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t("onboarding.progress", {
        current: currentIndex + 1,
        total: ONBOARDING_STEPS.length,
      })}
      className="flex-1 flex-row items-center gap-1.5"
    >
      {ONBOARDING_STEPS.map((step, index) => (
        <View
          key={step}
          className={`h-1 flex-1 rounded-full ${index <= currentIndex ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </View>
  );
}

/**
 * The chrome shared by every onboarding step.
 *
 * Progress and navigation live here rather than in each step, so a step owns
 * only its question and its field and cannot drift when the step list changes.
 * The title asks, the field answers, and the one primary action sits at the
 * bottom edge where a thumb already is — no card, no subtitle, nothing between
 * the question and the answer.
 */
export function OnboardingFrame({
  current,
  title,
  onBack,
  onSkip,
  skipLabel,
  busy = false,
  primaryLabel,
  onPrimaryPress,
  primaryLoading = false,
  primaryDisabled = false,
  children,
}: OnboardingFrameProps) {
  const { t } = useTranslation("auth");
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: insets.top }}
    >
      {/* Progress and navigation. The two fixed-width ends keep the bar
          centred whether or not the step has a back or a skip control. */}
      <View className="flex-row items-center gap-3 px-3 pt-2">
        <View className="w-11">
          {onBack ? (
            <Button
              size="icon"
              variant="ghost"
              accessibilityLabel={t("onboarding.back")}
              disabled={busy}
              onPress={onBack}
            >
              <ChevronLeftIcon size={20} />
            </Button>
          ) : null}
        </View>

        <View className="flex-1 items-center">
          <View style={{ width: "100%", maxWidth: 200 }}>
            <OnboardingProgress current={current} />
          </View>
        </View>

        <View className="w-11 items-end">
          {onSkip ? (
            <Button
              size="icon"
              variant="ghost"
              accessibilityLabel={skipLabel ?? t("onboarding.skip")}
              disabled={busy}
              onPress={onSkip}
            >
              <XIcon size={20} />
            </Button>
          ) : null}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="grow"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-8">
          <View className="mx-auto w-full max-w-md gap-8">
            <Text className="text-center text-3xl font-bold text-foreground">{title}</Text>
            {children}
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pt-2" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          size="lg"
          fullWidth
          loading={primaryLoading}
          disabled={primaryDisabled}
          onPress={onPrimaryPress}
        >
          {primaryLabel}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

export default OnboardingFrame;
