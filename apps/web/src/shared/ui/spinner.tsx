import { Loader2Icon } from "lucide-react";
import type React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Indeterminate loading indicator.
 *
 * The root is `<output>` rather than an svg with `role="status"` so the
 * announcement is carried by a semantic element; the icon is decorative. The
 * caller's `className` stays on the icon so sizing utilities keep working.
 */
export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof Loader2Icon>): React.ReactElement {
  return (
    <output aria-label="Loading" className="inline-flex">
      <Loader2Icon aria-hidden="true" className={cn("animate-spin", className)} {...props} />
    </output>
  );
}
