const ADJECTIVES = [
  "Curious",
  "Quiet",
  "Bright",
  "Gentle",
  "Rapid",
  "Steady",
  "Clever",
  "Kind",
] as const;

const NOUNS = [
  "Otter",
  "Falcon",
  "Willow",
  "Compass",
  "Harbor",
  "Lantern",
  "Meadow",
  "Summit",
] as const;

function pick<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  // The modulo above keeps `index` in range, but `noUncheckedIndexedAccess`
  // still widens the element type, so the assertion records that invariant.
  return items[index] as T;
}

/**
 * Display name for an anonymous (guest) account created by the `anonymous`
 * plugin. Guests never choose a name, so one is assigned to keep the UI and
 * activity feed coherent.
 */
export function generateDemoName(): string {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}
