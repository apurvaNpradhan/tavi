import { MailIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/ui/input-group";
import { FieldShell } from "./field-shell";
import type { TextFieldProps } from "./text-field";

export type EmailFieldProps = Omit<TextFieldProps, "type">;

/**
 * A labelled email input whose icon sits inside the input frame.
 *
 * The icon is a `type="email"` affordance only. The browser's own validation
 * stays off the critical path: the schema owns the error message.
 */
export function EmailField({ label, description, ...inputProps }: EmailFieldProps) {
  return (
    <FieldShell label={label} description={description}>
      {(control) => (
        <InputGroup>
          <InputGroupInput {...control} {...inputProps} type="email" />
          <InputGroupAddon align="inline-end">
            <MailIcon aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
      )}
    </FieldShell>
  );
}
