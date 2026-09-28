import { useTranslation } from "react-i18next";
import { SettingsSection } from "@/features/settings/settings-section";
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Label } from "@/shared/ui/label";
import { Radio, RadioGroup } from "@/shared/ui/radio-group";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { toastManager } from "@/shared/ui/toast";
import {
  type AppLocale,
  getLocaleLabel,
  supportedLocales,
  useLocale,
} from "@/shared/i18n/use-locale";
import type { Theme } from "@/features/appearance/theme";
import { useUserPreferencesStore } from "@/features/appearance/user-preferences";

/**
 * One theme choice, as a full-row hit target.
 *
 * The copy is passed in already translated rather than as a key: a table of keys
 * widens them to `string`, which loses the compile-time check that every key
 * exists.
 */
function ThemeOption({ value, label, hint }: { value: Theme; label: string; hint?: string }) {
  return (
    <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:bg-accent/60 has-data-checked:border-input has-data-checked:bg-accent">
      <Radio value={value} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="font-normal text-sm">{label}</span>
        {hint ? (
          <span className="text-balance font-normal text-muted-foreground text-xs">{hint}</span>
        ) : null}
      </span>
    </Label>
  );
}

/**
 * Presentation preferences.
 *
 * The theme reads and writes the local preferences store rather than the API: it
 * is a per-device choice, and keeping it client-side is what lets the first
 * paint use it without waiting on a request. The language is the opposite — it
 * is stored on the user, so it follows them between devices.
 *
 * A radio group rather than a segmented button set, because exactly one value is
 * always selected — that is the state model this control has, and it is what
 * gives the group its arrow-key behaviour and single tab stop.
 */
export function AppearanceSection() {
  const { t } = useTranslation("settings");
  const theme = useUserPreferencesStore((state) => state.theme);
  const setTheme = useUserPreferencesStore((state) => state.setTheme);
  const { locale, setLocale, isPending: isLocalePending } = useLocale();

  async function handleLocaleChange(next: AppLocale) {
    try {
      await setLocale(next);
    } catch {
      toastManager.add({ type: "error", title: t("appearance.languageFailed") });
    }
  }

  return (
    <SettingsSection title={t("appearance.title")} description={t("appearance.description")}>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium text-sm">{t("appearance.theme")}</legend>
        <RadioGroup
          value={theme}
          onValueChange={(value) => {
            // No coordinates: there is no single pressed control to reveal the
            // new theme from, so the transition falls back to the screen centre.
            setTheme(value as Theme);
          }}
          className="flex flex-col gap-1"
        >
          <ThemeOption
            value="system"
            label={t("appearance.themeSystem")}
            hint={t("appearance.themeSystemHint")}
          />
          <ThemeOption value="light" label={t("appearance.themeLight")} />
          <ThemeOption value="dark" label={t("appearance.themeDark")} />
        </RadioGroup>
      </fieldset>

      <Field>
        <FieldLabel htmlFor="appearance-language">{t("appearance.language")}</FieldLabel>
        <Select
          value={locale}
          disabled={isLocalePending}
          onValueChange={(value) => void handleLocaleChange(value as AppLocale)}
        >
          <SelectTrigger id="appearance-language">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {supportedLocales.map((option) => (
              <SelectItem key={option} value={option}>
                {getLocaleLabel(option)}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <FieldDescription>{t("appearance.languageHint")}</FieldDescription>
      </Field>
    </SettingsSection>
  );
}

export default AppearanceSection;
