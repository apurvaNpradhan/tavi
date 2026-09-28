const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;

/**
 * Formats a count of seconds as `1h 2m 3s`.
 *
 * Leading zero units are dropped, so 45s is `45s` and 125s is `2m 5s`, but the
 * units that follow a non-zero one are always shown (`1h 0m 5s`) so the shape
 * stays stable while a value counts up.
 *
 * The unit letters are English literals. Copy that a user reads and that should
 * be translated belongs in a locale file, so a translated surface should format
 * the parts itself instead of routing this through i18n as an opaque string.
 */
export function formatDuration(seconds: number): string {
  // A display helper, so a fractional or negative count is clamped rather than
  // rendering "-1m -30s" or "1.5s" at a call site that forgot to round.
  const total = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(total / SECONDS_PER_HOUR);
  const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const remainder = total % SECONDS_PER_MINUTE;

  if (hours > 0) return `${hours}h ${minutes}m ${remainder}s`;
  if (minutes > 0) return `${minutes}m ${remainder}s`;
  return `${remainder}s`;
}
