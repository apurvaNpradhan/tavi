import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./context";
import { EmailField } from "./email-field";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";
import { TextField } from "./text-field";

export { fieldContext, formContext, useFieldContext, useFormContext } from "./context";

export { EmailField, type EmailFieldProps } from "./email-field";

export { PasswordField, type PasswordFieldProps } from "./password-field";

export { SubmitButton, type SubmitButtonProps } from "./submit-button";

export { TextField, type TextFieldProps } from "./text-field";

/**
 * The app's one form hook factory.
 *
 * Binding the field components here is what lets `form.AppField` render
 * `field.TextField` / `field.EmailField` / `field.PasswordField` with the form's
 * value types inferred, instead of each caller importing a field and threading
 * value, change and error state by hand.
 */
export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField,
    EmailField,
    PasswordField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
