import { Loader2Icon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/shared/ui/button";
import { useFormContext } from "./context";

export type SubmitButtonProps = ComponentProps<typeof Button>;

/**
 * The form's submit button.
 *
 * Reads `canSubmit` and `isSubmitting` from the form it is rendered inside, so
 * a caller never has to thread those two flags down by hand.
 *
 * The label stays visible while the request is in flight. `Button`'s own
 * `loading` prop hides the label behind a centred spinner, which leaves only an
 * empty pill on a form whose submit label is the sole cue about what is
 * happening. The spinner here is decorative and must not join the accessible
 * name, so it is `aria-hidden` rather than the announcing `Spinner`.
 */
export function SubmitButton({ children, ...props }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
      })}
    >
      {({ canSubmit, isSubmitting }) => (
        <Button disabled={!canSubmit || isSubmitting} type="submit" {...props}>
          {isSubmitting ? (
            <Loader2Icon
              aria-hidden="true"
              className="size-4 animate-spin"
              data-slot="submit-pending-indicator"
            />
          ) : null}
          <span>{children}</span>
        </Button>
      )}
    </form.Subscribe>
  );
}
