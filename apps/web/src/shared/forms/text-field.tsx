import type { ComponentProps } from "react";
import { Input } from "@/shared/ui/input";
import { FieldShell } from "./field-shell";

export type TextFieldProps = {
  label: string;
  description?: string;
} & Omit<
  ComponentProps<typeof Input>,
  "id" | "name" | "value" | "onChange" | "onBlur" | "className" | "aria-invalid"
>;

/** A labelled text input bound to its TanStack field. */
export function TextField({ label, description, ...inputProps }: TextFieldProps) {
  return (
    <FieldShell label={label} description={description}>
      {(control) => <Input {...control} {...inputProps} />}
    </FieldShell>
  );
}
