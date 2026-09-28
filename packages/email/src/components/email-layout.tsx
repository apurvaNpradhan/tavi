import { Body, Container, Head, Html, Preview, Section, Tailwind } from "@react-email/components";
import type { ReactNode } from "react";

import { EmailFooter } from "./email-footer";
import { EmailLogo } from "./email-logo";
import tailwindConfig from "./tailwind.config";

/** The inbox preview line and body content shared by every template. */
export interface EmailLayoutProps {
  readonly preview: string;
  readonly children: ReactNode;
}

/**
 * The shared email shell: a flat column on the page background.
 *
 * There is no card. Depth comes from spacing and the single hairline above the
 * footer, so a message reads as a document rather than a widget, and nothing is
 * lost when a client drops borders.
 *
 * `lang` and `dir` are repeated on the body's direct child because several
 * clients strip them from `<html>`.
 */
export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={tailwindConfig}>
        <Head />
        <Body className="m-0 bg-background px-[16px] py-[40px] font-sans" lang="en" dir="ltr">
          <Preview>{preview}</Preview>
          <Container className="mx-auto max-w-[540px]" lang="en" dir="ltr">
            <EmailLogo />
            <Section className="pt-[40px]">{children}</Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
