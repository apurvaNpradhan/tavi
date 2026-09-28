/** Largest avatar accepted, in bytes. */
export const MAX_AVATAR_BYTES = 512 * 1024;

/**
 * Accepted image types.
 *
 * Deliberately narrow: the browser resizes and re-encodes an avatar before
 * uploading (`apps/web/src/features/account/prepare-avatar-image.ts`), so anything outside
 * this set is either a direct API caller or a client that skipped
 * normalization. Every entry also has a magic-byte check below, which is what
 * keeps a mislabeled file from being served as an image.
 */
const AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Upper bound on the base64 string for a payload of `MAX_AVATAR_BYTES`.
 *
 * Checked before `Buffer.from` so an oversized request is rejected without
 * allocating a decoded copy of it first.
 */
const MAX_AVATAR_BASE64_LENGTH = Math.ceil(MAX_AVATAR_BYTES / 3) * 4;

/**
 * Longest accepted `data` field, including a `data:` URL prefix.
 *
 * Exported so the request schema can reject an oversized body before it is
 * buffered as a string; the tighter bound above applies to the decoded payload.
 */
export const MAX_AVATAR_DATA_LENGTH = MAX_AVATAR_BASE64_LENGTH + 64;

export function isAvatarMimeType(value: string): value is AvatarMimeType {
  return (AVATAR_MIME_TYPES as readonly string[]).includes(value);
}

/** `image/jpg` is a common mislabel; browsers and encoders disagree on it. */
export function normalizeAvatarMimeType(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
}

/**
 * Confirms the bytes are really the declared format.
 *
 * The declared content type is client-supplied and therefore a hint at best.
 * These signatures are the cheap, exact prefix check for each allowed format;
 * they are not a full parse, and `X-Content-Type-Options: nosniff` on the
 * download response covers the rest.
 *
 * Keyed by the union rather than switched over it, so adding a format to
 * `AVATAR_MIME_TYPES` fails to compile until its check exists.
 */
const MAGIC_BYTE_CHECKS: Record<AvatarMimeType, (bytes: Buffer) => boolean> = {
  "image/png": (bytes) =>
    bytes.length >= 8 &&
    bytes
      .subarray(0, 8)
      // biome-ignore format: PNG signature
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/jpeg": (bytes) =>
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/webp": (bytes) =>
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP",
};

function hasMagicBytes(mimeType: AvatarMimeType, bytes: Buffer) {
  return MAGIC_BYTE_CHECKS[mimeType](bytes);
}

/** A decoded, format-verified avatar ready to be stored. */
export type DecodedAvatar = {
  mimeType: AvatarMimeType;
  bytes: Buffer;
};

/**
 * Validates and decodes an uploaded avatar.
 *
 * Throws with a client-safe message rather than returning a result object: the
 * caller turns every failure into the same 400, and the reasons are written for
 * a person reading a toast, not for branching on.
 */
export function decodeAvatarUpload(input: { contentType: string; data: string }): DecodedAvatar {
  const mimeType = normalizeAvatarMimeType(input.contentType);

  if (!isAvatarMimeType(mimeType)) {
    throw new Error("Unsupported image type. Upload a PNG, JPEG, or WebP image.");
  }

  // Accepts a bare payload or a `data:` URL, which canvas encoders produce.
  const payload = input.data.replace(/^data:[^;,]*;base64,/, "").replace(/\s+/g, "");

  if (!payload || !BASE64_PATTERN.test(payload) || payload.length % 4 !== 0) {
    throw new Error("Image data must be base64 encoded.");
  }

  if (payload.length > MAX_AVATAR_BASE64_LENGTH) {
    throw new Error(
      `Image exceeds the maximum avatar size of ${Math.floor(MAX_AVATAR_BYTES / 1024)}KB.`,
    );
  }

  const bytes = Buffer.from(payload, "base64");

  if (bytes.length === 0) {
    throw new Error("Image data must not be empty.");
  }

  if (bytes.length > MAX_AVATAR_BYTES) {
    throw new Error(
      `Image exceeds the maximum avatar size of ${Math.floor(MAX_AVATAR_BYTES / 1024)}KB.`,
    );
  }

  if (!hasMagicBytes(mimeType, bytes)) {
    throw new Error(`Image data does not match the declared ${mimeType} type.`);
  }

  return { mimeType, bytes };
}

/**
 * The public, stable address of a stored avatar.
 *
 * Relative on purpose: the API is mounted at `/api` behind the same origin in
 * both dev and the bundled image, so a stored absolute URL would bake an
 * environment's hostname into the database. The web app resolves the prefix
 * against its configured API origin — see `apps/web/src/features/account/resolve-avatar-src.ts`.
 */
export function buildAvatarUrl(avatarId: string) {
  return `/api/user/avatar/${avatarId}`;
}
