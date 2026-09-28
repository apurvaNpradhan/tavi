import { beforeEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./copy-to-clipboard";

/**
 * jsdom implements neither `navigator.clipboard` nor `document.execCommand`, so
 * both routes are installed per test. Defined rather than spied: there is no
 * existing property to spy on.
 */
function stubAsyncClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

const execCommand = vi.fn<() => boolean>();

describe("copyToClipboard", () => {
  beforeEach(() => {
    // The baseline for every test is "no async clipboard", so a test that wants
    // it opts in and the fallback path is the default under test.
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    execCommand.mockReset();
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      writable: true,
      value: execCommand,
    });
  });

  it("uses the async clipboard when it is available", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    stubAsyncClipboard(writeText);

    await expect(copyToClipboard("https://example.test/invite")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://example.test/invite");
    expect(execCommand).not.toHaveBeenCalled();
  });

  it("falls back when the async clipboard is absent", async () => {
    execCommand.mockReturnValue(true);

    await expect(copyToClipboard("https://example.test/invite")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("falls back when the async clipboard refuses", async () => {
    const writeText = vi
      .fn<(text: string) => Promise<void>>()
      .mockRejectedValue(new Error("Write permission denied"));
    stubAsyncClipboard(writeText);
    execCommand.mockReturnValue(true);

    await expect(copyToClipboard("value")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("reports failure when neither route works", async () => {
    execCommand.mockReturnValue(false);

    await expect(copyToClipboard("value")).resolves.toBe(false);
  });

  it("leaves no scratch element behind", async () => {
    execCommand.mockReturnValue(true);

    await copyToClipboard("value");

    expect(document.querySelector("textarea")).toBeNull();
  });
});
