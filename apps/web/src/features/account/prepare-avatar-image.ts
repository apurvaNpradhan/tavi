export const AVATAR_OUTPUT_SIZE = 256;

/** Largest source file accepted, before the resize. */
export const MAX_AVATAR_SOURCE_BYTES = 10 * 1024 * 1024;

/** The `accept` attribute for the file input. */
export const ACCEPTED_AVATAR_TYPES = "image/*";

const SUPPORTED_OUTPUT_TYPES = ["image/webp", "image/png"] as const;

export type PreparedAvatar = {
  contentType: string;
  data: string;
};

function isSupportedOutputType(type: string) {
  return (SUPPORTED_OUTPUT_TYPES as readonly string[]).includes(type);
}

/**
 * The centred square crop of a `width` x `height` image.
 *
 * Avatars render in a circle, so cropping to the largest centred square in the
 * browser is what stops faces from being squashed by `object-cover`.
 */
export function getCoverCropRect(width: number, height: number) {
  const side = Math.min(width, height);

  return {
    sourceX: Math.round((width - side) / 2),
    sourceY: Math.round((height - side) / 2),
    side,
  };
}

/**
 * Decodes a file to something drawable on a canvas.
 *
 * `createImageBitmap` is preferred because `imageOrientation: "from-image"`
 * applies the EXIF rotation, which a plain `<img>` may not. The element path is
 * the fallback for browsers without it.
 */
async function decodeImage(file: File) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error("The image could not be read.")), {
        once: true,
      });
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, 0.9);
  });
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  // Chunked so a large image does not blow the argument limit of `apply`.
  const CHUNK = 0x8000;
  for (let index = 0; index < bytes.length; index += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(index, index + CHUNK));
  }

  return btoa(binary);
}

/**
 * Normalizes a chosen file into a small square avatar ready to upload.
 *
 * Runs in the browser because that is where a canvas, the decoder and the user's
 * own CPU are: the server receives a bounded 256x256 WebP instead of an
 * arbitrary multi-megabyte photo, which is what lets it enforce a small size cap
 * and a strict format allowlist.
 */
export async function prepareAvatarImage(file: File): Promise<PreparedAvatar> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }

  if (file.size > MAX_AVATAR_SOURCE_BYTES) {
    throw new Error("Choose an image smaller than 10MB.");
  }

  const source = await decodeImage(file);
  const width = "width" in source ? source.width : 0;
  const height = "height" in source ? source.height : 0;

  if (!width || !height) {
    throw new Error("The image could not be read.");
  }

  const { sourceX, sourceY, side } = getCoverCropRect(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("The image could not be processed.");
  }

  context.imageSmoothingQuality = "high";
  context.drawImage(
    source as CanvasImageSource,
    sourceX,
    sourceY,
    side,
    side,
    0,
    0,
    AVATAR_OUTPUT_SIZE,
    AVATAR_OUTPUT_SIZE,
  );

  if ("close" in source) {
    source.close();
  }

  const blob = (await toBlob(canvas, "image/webp")) ?? (await toBlob(canvas, "image/png"));

  if (!blob || !isSupportedOutputType(blob.type)) {
    throw new Error("The image could not be processed.");
  }

  return {
    contentType: blob.type,
    data: await blobToBase64(blob),
  };
}
