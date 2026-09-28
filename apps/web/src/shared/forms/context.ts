import { createFormHookContexts } from "@tanstack/react-form";

// Contexts shared by every component bound to an app form. Exported so field
// and form components (and consumers using `withForm`) can read them.
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();
