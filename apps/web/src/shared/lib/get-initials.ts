/**
 * Up to two uppercase characters for an avatar fallback.
 *
 * Uppercasing happens *before* selecting characters because some characters
 * expand when uppercased (`"ß"` becomes `"SS"`), and uppercasing afterwards
 * could therefore return more than two.
 */
export function getInitials(value: string | null | undefined, fallback = "??") {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (parts.length === 0) {
    return Array.from(fallback).slice(0, 2).join("").toUpperCase();
  }

  if (parts.length === 1) {
    return Array.from(parts[0].toUpperCase()).slice(0, 2).join("");
  }

  return parts
    .slice(0, 2)
    .map((part) => Array.from(part.toUpperCase())[0])
    .join("");
}

export default getInitials;
