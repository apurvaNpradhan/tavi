import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  buildAvatarUrl,
  decodeAvatarUpload,
  MAX_AVATAR_BYTES,
  MAX_AVATAR_DATA_LENGTH,
  normalizeAvatarMimeType,
} from "../../../apps/api/src/user/avatar";

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function encode(bytes: ArrayLike<number>) {
  return Buffer.from(bytes).toString("base64");
}

/** A payload of `size` bytes that still starts with a valid PNG signature. */
function pngOfSize(size: number) {
  const bytes = Buffer.alloc(size);
  Buffer.from(PNG_HEADER).copy(bytes);
  return bytes.toString("base64");
}

function webpHeader() {
  return Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from("WEBP", "ascii"),
    Buffer.from([0x00]),
  ]);
}

describe("decodeAvatarUpload", () => {
  it("accepts a PNG upload", () => {
    const result = decodeAvatarUpload({
      contentType: "image/png",
      data: encode([...PNG_HEADER, 1, 2, 3]),
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.bytes.length).toBe(11);
  });

  it("accepts a JPEG upload", () => {
    const result = decodeAvatarUpload({
      contentType: "image/jpeg",
      data: encode([0xff, 0xd8, 0xff, 0xe0, 0x00]),
    });

    expect(result.mimeType).toBe("image/jpeg");
  });

  it("accepts a WebP upload", () => {
    const result = decodeAvatarUpload({
      contentType: "image/webp",
      data: webpHeader().toString("base64"),
    });

    expect(result.mimeType).toBe("image/webp");
  });

  it("accepts a data: URL prefix, which a canvas encoder produces", () => {
    const result = decodeAvatarUpload({
      contentType: "image/png",
      data: `data:image/png;base64,${encode([...PNG_HEADER, 1])}`,
    });

    expect(result.bytes.length).toBe(9);
  });

  it("tolerates whitespace in the payload", () => {
    const result = decodeAvatarUpload({
      contentType: "image/png",
      data: `${encode([...PNG_HEADER, 1]).slice(0, 8)}\n${encode([...PNG_HEADER, 1]).slice(8)}`,
    });

    expect(result.bytes.length).toBe(9);
  });

  it("normalizes image/jpg and casing to image/jpeg", () => {
    expect(normalizeAvatarMimeType("IMAGE/JPG")).toBe("image/jpeg");

    const result = decodeAvatarUpload({
      contentType: "IMAGE/JPEG",
      data: encode([0xff, 0xd8, 0xff, 0xe0, 0x00]),
    });

    expect(result.mimeType).toBe("image/jpeg");
  });

  it("rejects a type outside the allowed set", () => {
    expect(() =>
      decodeAvatarUpload({ contentType: "image/gif", data: encode([0x47, 0x49, 0x46]) }),
    ).toThrow(/Unsupported image type/);
  });

  it("rejects a payload that is not base64", () => {
    expect(() => decodeAvatarUpload({ contentType: "image/png", data: "not base64!" })).toThrow(
      /base64/,
    );
  });

  it("rejects an empty payload", () => {
    expect(() => decodeAvatarUpload({ contentType: "image/png", data: "" })).toThrow(/base64/);
  });

  it("rejects a decoded payload larger than the limit", () => {
    expect(() =>
      decodeAvatarUpload({
        contentType: "image/png",
        data: pngOfSize(MAX_AVATAR_BYTES + 2),
      }),
    ).toThrow(/maximum avatar size/);
  });

  it("rejects an oversized base64 string before decoding it", () => {
    // Longer than any valid payload can be, so the string guard rejects it
    // rather than the decoded-size check.
    const data = "A".repeat(MAX_AVATAR_DATA_LENGTH + 4);

    expect(() => decodeAvatarUpload({ contentType: "image/png", data })).toThrow(
      /maximum avatar size/,
    );
  });

  it("rejects bytes that do not match the declared type", () => {
    expect(() =>
      decodeAvatarUpload({
        contentType: "image/png",
        data: Buffer.from("<html>hello</html>").toString("base64"),
      }),
    ).toThrow(/does not match the declared/);
  });

  it("rejects a PNG signature declared as WebP", () => {
    expect(() =>
      decodeAvatarUpload({ contentType: "image/webp", data: encode(PNG_HEADER) }),
    ).toThrow(/does not match the declared/);
  });
});

describe("buildAvatarUrl", () => {
  it("builds an API-relative URL so no hostname is stored", () => {
    expect(buildAvatarUrl("abc123")).toBe("/api/user/avatar/abc123");
  });
});
