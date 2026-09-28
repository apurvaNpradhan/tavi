import { Hr, Link, Section, Text } from "@react-email/components";

import { APP_NAME, CLIENT_URL } from "./email-env";

/**
 * The hairline and copyright that close every template.
 *
 * The year is read at render time so a long-lived build does not ship a stale
 * copyright. Padding sits on the section's cell, which every client honours.
 */
export function EmailFooter() {
  return (
    <Section className="pt-[72px]">
      <Hr className="m-0 border-solid border-border" />
      <Text className="m-0 mt-[16px] text-[13px] leading-[1.5] text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}
      </Text>
      <Text className="m-0 mt-[4px] text-[13px] leading-[1.5] text-muted-foreground">
        <Link href={CLIENT_URL} className="text-muted-foreground underline">
          {CLIENT_URL}
        </Link>
      </Text>
    </Section>
  );
}
