import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("shows seconds alone below a minute", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(59)).toBe("59s");
  });

  it("shows minutes and seconds below an hour", () => {
    expect(formatDuration(60)).toBe("1m 0s");
    expect(formatDuration(125)).toBe("2m 5s");
    expect(formatDuration(3599)).toBe("59m 59s");
  });

  it("shows all three units from an hour up", () => {
    expect(formatDuration(3600)).toBe("1h 0m 0s");
    expect(formatDuration(3661)).toBe("1h 1m 1s");
    expect(formatDuration(86_400)).toBe("24h 0m 0s");
  });

  it("keeps trailing units visible once a larger one is present", () => {
    // 3605s is 1h 0m 5s, not "1h 5s": the shape should not shift under a
    // counting-up value.
    expect(formatDuration(3605)).toBe("1h 0m 5s");
  });

  it("clamps fractional and negative input", () => {
    expect(formatDuration(90.9)).toBe("1m 30s");
    expect(formatDuration(-10)).toBe("0s");
  });
});
