import { Button } from "@react-email/components";
import type { ReactNode } from "react";

/**
 * A single primary action, sized to the design system's 36px control.
 *
 * The anchor stays inline-block so the button hugs its label on the left, the
 * way the layout places it. `box-border` keeps padding inside.
 */
export interface EmailButtonProps {
  readonly href: string;
  readonly children: ReactNode;
  /**
   * `destructive` is the `DESIGN.md` fill for irreversible actions. It defaults
   * to the neutral primary, so a template opts in only when the action cannot
   * be undone.
   */
  readonly tone?: "primary" | "destructive";
}

export function EmailButton({ href, children, tone = "primary" }: EmailButtonProps) {
  const palette =
    tone === "destructive" ? "bg-destructive text-white" : "bg-primary text-primary-foreground";

  return (
    <Button
      href={href}
      className={`box-border inline-block rounded-md px-[16px] py-[8px] text-[14px] leading-[20px] font-medium no-underline ${palette}`}
    >
      {children}
    </Button>
  );
}
