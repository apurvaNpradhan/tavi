import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for the delay before calling through", () => {
    const callback = vi.fn<() => void>();
    const debounced = debounce(callback, 200);

    debounced();
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("collapses a burst into a single call with the last arguments", () => {
    const callback = vi.fn<(value: string) => void>();
    const debounced = debounce(callback, 200);

    debounced("a");
    vi.advanceTimersByTime(100);
    debounced("b");
    vi.advanceTimersByTime(100);
    debounced("c");

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("c");
  });

  it("starts a fresh delay on each call", () => {
    const callback = vi.fn<() => void>();
    const debounced = debounce(callback, 200);

    debounced();
    // 199ms is inside the window, so this call restarts it.
    vi.advanceTimersByTime(199);
    debounced();
    vi.advanceTimersByTime(199);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("drops a pending call when cancelled", () => {
    const callback = vi.fn<() => void>();
    const debounced = debounce(callback, 200);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });

  it("still runs calls made after a cancel", () => {
    const callback = vi.fn<() => void>();
    const debounced = debounce(callback, 200);

    debounced();
    debounced.cancel();
    debounced();
    vi.advanceTimersByTime(200);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
