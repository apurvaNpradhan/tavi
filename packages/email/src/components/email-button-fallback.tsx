import { Link } from "@react-email/components";

import { EmailParagraph } from "./email-typography";

/**
 * The line under a button that offers the same destination as text.
 *
 * The visible label is short on purpose; the raw URL stays in the link target
 * so a long token never widens the layout or wraps mid-token.
 */
export function EmailButtonFallback({ href }: { readonly href: string }) {
  return (
    <EmailParagraph>
      If you&apos;re having trouble with the above button,{" "}
      <Link href={href} className="text-foreground underline">
        click here
      </Link>
      .
    </EmailParagraph>
  );
}
