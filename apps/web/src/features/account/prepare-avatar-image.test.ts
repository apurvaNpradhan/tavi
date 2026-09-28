import { describe, expect, it } from "vitest";
import { AVATAR_OUTPUT_SIZE, getCoverCropRect } from "./prepare-avatar-image";

describe("getCoverCropRect", () => {
  it("crops the longer axis of a landscape image, centred", () => {
    expect(getCoverCropRect(1200, 800)).toEqual({ sourceX: 200, sourceY: 0, side: 800 });
  });

  it("crops the longer axis of a portrait image, centred", () => {
    expect(getCoverCropRect(800, 1200)).toEqual({ sourceX: 0, sourceY: 200, side: 800 });
  });

  it("leaves a square image whole", () => {
    expect(getCoverCropRect(512, 512)).toEqual({ sourceX: 0, sourceY: 0, side: 512 });
  });

  it("stays inside the source when the offset rounds", () => {
    // A 1px difference rounds the centred offset to 1, not 0.5; the invariant
    // that matters is that the crop never reads past the edge.
    const rect = getCoverCropRect(1001, 1000);

    expect(rect.side).toBe(1000);
    expect(rect.sourceX).toBe(1);
    expect(rect.sourceX + rect.side).toBeLessThanOrEqual(1001);
  });
});

describe("avatar output size", () => {
  it("is a square that fits well under the server's limit", () => {
    expect(AVATAR_OUTPUT_SIZE).toBe(256);
  });
});
