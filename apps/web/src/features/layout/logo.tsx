import { Link } from "@tanstack/react-router";
import { cn } from "@/shared/lib/utils";

type LogoProps = {
  variant?: "full" | "icon" | "responsive";
  asLink?: boolean;
  className?: string;
};

const APP_NAME = "Tavi";

/**
 * The app lockup: the brand mark plus the name.
 *
 * `responsive` drops the name when the sidebar collapses to its icon rail, so
 * the swap is driven by the sidebar's `data-collapsible` attribute rather than a
 * prop the sidebar would have to plumb through.
 */
export function Logo({ variant = "full", asLink = true, className }: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src="/favicon-96x96.png"
        alt=""
        aria-hidden="true"
        className="size-6 shrink-0 rounded-md"
      />
      {variant === "icon" ? null : (
        <span
          className={cn(
            "font-semibold text-lg tracking-tight",
            variant === "responsive" && "group-data-[collapsible=icon]:hidden",
          )}
        >
          {APP_NAME}
        </span>
      )}
    </span>
  );

  if (!asLink) return content;

  return <Link to="/">{content}</Link>;
}

export default Logo;
