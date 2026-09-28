import { Heading, Text } from "@react-email/components";
import type { ReactNode } from "react";

/** The single `<h1>` that names an email. */
export function EmailHeading({ children }: { readonly children: ReactNode }) {
  return (
    <Heading
      as="h1"
      className="m-0 mb-[16px] text-[24px] leading-[1.25] font-semibold tracking-[-0.04em] text-foreground"
    >
      {children}
    </Heading>
  );
}

/**
 * A body paragraph.
 *
 * Body copy sits at `muted-foreground` so the heading carries the hierarchy and
 * the prose stays quiet. `#696969` on white holds 5.5:1, so it still clears AA
 * even after a client's dark-mode inversion.
 */
export function EmailParagraph({ children }: { readonly children: ReactNode }) {
  return (
    <Text className="m-0 mb-[16px] text-[15px] leading-[1.55] text-muted-foreground">
      {children}
    </Text>
  );
}
