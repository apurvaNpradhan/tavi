#!/usr/bin/env node
/**
 * Exposes the resolved version to the workflow's later jobs.
 *
 * This runs in semantic-release's `verifyRelease` step, which a `--dry-run`
 * still executes. That is the only reason the workflow can decide whether to
 * release before it starts releasing.
 */
import { appendFileSync } from "node:fs";

const version = process.argv[2] ?? "";

console.log(`Next release version: ${version || "(none)"}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
}
