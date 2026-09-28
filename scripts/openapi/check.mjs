#!/usr/bin/env node
/**
 * Keeps the committed `openapi.json` in step with the API routes.
 *
 * A contract change that is not reflected in the committed document is a
 * review problem: API consumers and docs are generated from that file. CI runs
 * this with `--check` semantics (the default) and fails on drift.
 *
 * Usage:
 *   node scripts/openapi/check.mjs          # fail if the artifact is stale
 *   node scripts/openapi/check.mjs --fix    # rewrite the artifact
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const artifactPath = join(root, "openapi.json");
const fix = process.argv.includes("--fix");

const tempDir = mkdtempSync(join(tmpdir(), "openapi-"));
const generatedPath = join(tempDir, "openapi.json");

function flattenPaths(document) {
  const paths = document?.paths ?? {};
  const lines = [];

  for (const [path, operations] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(operations ?? {})) {
      lines.push(`${method.toUpperCase()} ${path}  # ${operation.operationId ?? "?"}`);
    }
  }

  return lines.toSorted();
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .toSorted(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalJson(child)]),
    );
  }
  return value;
}

function diff(before, after) {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return {
    added: after.filter((line) => !beforeSet.has(line)),
    removed: before.filter((line) => !afterSet.has(line)),
  };
}

try {
  // Run the exporter through the API package so it resolves workspace deps.
  execFileSync(
    "pnpm",
    ["--filter", "@tavi/api", "exec", "tsx", "scripts/export-openapi.ts", generatedPath],
    { cwd: root, stdio: "inherit" },
  );

  const generated = JSON.parse(readFileSync(generatedPath, "utf8"));

  if (!existsSync(artifactPath)) {
    if (fix) {
      writeFileSync(artifactPath, readFileSync(generatedPath));
      console.log("Created openapi.json");
      process.exit(0);
    }
    console.error("openapi.json is missing. Run: pnpm openapi:check:fix");
    process.exit(1);
  }

  const committed = JSON.parse(readFileSync(artifactPath, "utf8"));
  const committedLines = flattenPaths(committed);
  const generatedLines = flattenPaths(generated);
  const { added, removed } = diff(committedLines, generatedLines);

  const documentMatches =
    JSON.stringify(canonicalJson(committed)) === JSON.stringify(canonicalJson(generated));

  if (documentMatches) {
    console.log(`✅ openapi.json is up to date (${generatedLines.length} operations)`);
    process.exit(0);
  }

  if (fix) {
    writeFileSync(artifactPath, readFileSync(generatedPath));
    console.log(
      `Updated openapi.json (${added.length} added, ${removed.length} removed operations)`,
    );
    process.exit(0);
  }

  console.error("❌ openapi.json is out of date with the generated API document.\n");
  for (const line of added) console.error(`  + ${line}`);
  for (const line of removed) console.error(`  - ${line}`);
  if (added.length === 0 && removed.length === 0) {
    console.error("  Schemas, security, metadata, or other document fields changed.");
  }
  console.error("\nRun: pnpm openapi:check:fix");
  process.exit(1);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
