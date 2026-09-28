import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/ui/input-group";
import { FieldShell } from "./field-shell";
import type { TextFieldProps } from "./text-field";

export type PasswordFieldProps = Omit<TextFieldProps, "type">;

/**
 * A labelled password input with a visibility toggle.
 *
 * The toggle only changes the input's `type`, never its value, so browsers with
 * a password manager keep the field attached to the same credential.
 */
export function PasswordField({ label, description, ...inputProps }: PasswordFieldProps) {
  const { t } = useTranslation("common");
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FieldShell label={label} description={description}>
      {(control) => (
        <InputGroup>
          <InputGroupInput {...control} {...inputProps} type={isVisible ? "text" : "password"} />
          <InputGroupAddon align="inline-end">
            <Button
              aria-label={isVisible ? t("hidePassword") : t("showPassword")}
              onClick={() => setIsVisible((visible) => !visible)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              {isVisible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
            </Button>
          </InputGroupAddon>
        </InputGroup>
      )}
    </FieldShell>
  );
}
