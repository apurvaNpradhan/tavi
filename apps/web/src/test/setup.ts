import "@testing-library/jest-dom/vitest";

type MediaQueryListener = (event: MediaQueryListEvent) => void;

/**
 * jsdom does not implement `matchMedia`, which the theme provider reads to
 * resolve the `system` preference and to follow OS scheme changes. This stub
 * reports a light system scheme; tests that need dark pass `true`.
 */
export function stubMatchMedia(prefersDark = false): void {
  window.matchMedia = (query: string): MediaQueryList => {
    const listeners = new Set<MediaQueryListener>();

    return {
      matches: query.includes("prefers-color-scheme: dark") ? prefersDark : false,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.add(listener as MediaQueryListener);
      },
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.delete(listener as MediaQueryListener);
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
}

stubMatchMedia();
