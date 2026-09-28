import { Text } from "@react-email/components";

/**
 * A one-time code, set large enough to read off a second screen.
 *
 * `DESIGN.md` puts machine-readable text in JetBrains Mono, and
 * `overflow-wrap: anywhere` keeps a pasted long code from widening the column.
 */
export function EmailCode({ code }: { readonly code: string }) {
  return (
    <Text className="m-0 mt-[8px] mb-[24px] font-mono text-[32px] leading-[1.2] font-medium tracking-[0.08em] text-foreground [overflow-wrap:anywhere]">
      {code}
    </Text>
  );
}
