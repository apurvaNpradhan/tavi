import type { ChangeEvent, ReactNode } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { useFieldContext } from "./context";
import { fieldErrorMessages } from "./field-errors";

/** The wiring a control needs to be driven by its TanStack field. */
export type FieldControlProps = {
  id: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  "aria-invalid": true | undefined;
};

export type FieldShellProps = {
  label: string;
  description?: string;
  /** Renders the control, given the props that bind it to the field. */
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * The label, control slot, description and errors around one field.
 *
 * Email and password fields differ only in their control, so they share this
 * shell rather than repeating the field-state wiring per field type.
 */
export function FieldShell({ label, description, children }: FieldShellProps) {
  const field = useFieldContext<string>();
  // Only after the user has engaged with the field: an untouched empty field
  // is not yet a mistake worth showing.
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errors = fieldErrorMessages(field.state.meta.errors);

  return (
    <Field invalid={isInvalid || undefined} name={field.name}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {children({
        id: field.name,
        name: field.name,
        value: field.state.value,
        onChange: (event) => field.handleChange(event.target.value),
        onBlur: field.handleBlur,
        "aria-invalid": isInvalid || undefined,
      })}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {errors.length > 0 ? <FieldError match>{errors.join(" ")}</FieldError> : null}
    </Field>
  );
}
