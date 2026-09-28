import { Section, Text } from "@react-email/components";

/** What the recipient was sent, and any request details the caller recorded. */
export interface EmailRequestNoticeProps {
  /** Names the thing that was sent, e.g. `"code"` or `"sign-in link"`. */
  readonly requestedThing: string;
  /** Originating address, when the caller captured one. */
  readonly requestedFrom?: string;
  /** Preformatted local timestamp, when the caller captured one. */
  readonly requestedAt?: string;
}

/**
 * State where the request came from, degrading to whatever the caller recorded.
 *
 * Request details are optional because the sender may not have them, and an
 * email that invents a location is worse than one that omits it.
 */
function describeRequest({
  requestedThing,
  requestedFrom,
  requestedAt,
}: EmailRequestNoticeProps): string {
  const requested = `This ${requestedThing} was requested`;

  if (requestedFrom !== undefined && requestedAt !== undefined) {
    return `${requested} from ${requestedFrom} at ${requestedAt}.`;
  }

  if (requestedFrom !== undefined) {
    return `${requested} from ${requestedFrom}.`;
  }

  if (requestedAt !== undefined) {
    return `${requested} at ${requestedAt}.`;
  }

  return `${requested}.`;
}

/**
 * The "Didn't request this?" block that closes a security-sensitive email.
 *
 * It sits far enough below the action that it reads as a footnote to the whole
 * message rather than as part of the instruction above it.
 */
export function EmailRequestNotice(props: EmailRequestNoticeProps) {
  return (
    <Section className="pt-[56px]">
      <Text className="m-0 mb-[8px] text-[14px] leading-[1.4] font-semibold text-foreground">
        Didn&apos;t request this?
      </Text>
      <Text className="m-0 text-[15px] leading-[1.55] text-muted-foreground">
        {describeRequest(props)} If you didn&apos;t make this request, you can safely ignore this
        email.
      </Text>
    </Section>
  );
}
