#!/usr/bin/env node
/**
 * Writes the released version into the root manifest, so a checkout reports the
 * version it was released as.
 *
 * Runs as semantic-release's `prepare` step. Only the root `package.json` is
 * touched: the workspace packages are private and versioned independently, and
 * nothing consumes their version numbers.
 *
 * The post-rewrite assertion is deliberate. A regex that silently stops
 * matching (because the manifest was reformatted, say) would produce a release
 * tagged v1.2.3 whose manifest still says 0.1.0, and nothing downstream would
 * notice.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const version = process.argv[2] ?? "";

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`apply-version: expected a semver version, received ${JSON.stringify(version)}`);
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const path = join(root, "package.json");
const next = readFileSync(path, "utf8").replace(/^(\s*"version":\s*")[^"]*(")/m, `$1${version}$2`);

if (!next.includes(`"version": "${version}"`)) {
  console.error(
    `apply-version: package.json has no "version": "${version}" after rewriting; update this script`,
  );
  process.exit(1);
}

writeFileSync(path, next);
console.log(`apply-version: package.json -> ${version}`);
