/** A debounced function, carrying the `cancel` escape hatch described below. */
export type Debounced<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
};

/**
 * Runs `callback` only once `delay` ms have passed without another call.
 *
 * Meant for input that fires on every keystroke. Only the last call in a burst
 * runs, so this is a debounce rather than a throttle.
 *
 * `cancel` exists because the timer outlives the call site: a component that
 * unmounts with a pending debounce still gets its callback fired, and the
 * closure then touches state that no longer exists. Callers cancel on unmount.
 *
 * A `void` callback is deliberate. Accepting a promise would mean either
 * awaiting inside the timer (which cannot be cancelled) or dropping a
 * rejection on the floor; an async callback should handle its own failure.
 */
export function debounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): Debounced<Args> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Args): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };

  debounced.cancel = (): void => {
    clearTimeout(timeout);
    timeout = undefined;
  };

  return debounced;
}
