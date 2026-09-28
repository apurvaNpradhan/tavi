import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "@tavi/env/server";

/**
 * Resolves the secret Better Auth signs sessions with.
 *
 * In production a real secret is mandatory: generating one silently would
 * invalidate every session on each restart and, worse, look like it works. In
 * development a random secret is generated once and persisted to `.auth-secret`
 * so restarts keep working.
 */
export function resolveAuthSecret(): string {
  const fromEnv = env.AUTH_SECRET?.trim();
  if (fromEnv) {
    if (fromEnv.length < 32) {
      throw new Error(
        "AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -hex 32",
      );
    }
    return fromEnv;
  }

  if (env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is required in production. Generate one with: openssl rand -hex 32",
    );
  }

  const secretPath = join(process.cwd(), ".auth-secret");
  try {
    const existing = readFileSync(secretPath, "utf8").trim();
    if (existing.length >= 32) {
      return existing;
    }
  } catch {
    // No persisted secret yet.
  }

  const generated = randomBytes(32).toString("hex");
  try {
    writeFileSync(secretPath, generated, { mode: 0o600 });
    console.warn(
      "AUTH_SECRET was not set. Generated a development secret at .auth-secret (do not commit it).",
    );
  } catch {
    console.warn(
      "AUTH_SECRET was not set and a development secret could not be persisted. Sessions will not survive a restart.",
    );
  }

  return generated;
}
