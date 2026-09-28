#!/usr/bin/env node
/**
 * Points git at Lefthook's hooks. Run from the `prepare` lifecycle script, so
 * `pnpm install` is all a contributor needs to do.
 *
 * Lefthook's own postinstall already syncs hooks in a normal install; this
 * exists for the cases it does not cover — hooks removed by a `git clean`, a
 * changed `core.hooksPath`, or a checkout where the package was already in the
 * store — and to make the intent visible in `package.json`.
 *
 * `prepare` also runs while building the Docker images, where `.git` is
 * excluded by `.dockerignore`. There is nothing to hook inside a container, so
 * skipping is correct there rather than failing the image build. `LEFTHOOK=0`
 * is honoured as an explicit opt-out, matching the variable Lefthook itself
 * reads to decide whether to run.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// `.git` is a directory in a normal clone and a file in a worktree or
// submodule, so existence is the only thing worth checking.
if (!existsSync(join(root, ".git")) || process.env.LEFTHOOK === "0") {
  console.log("install-git-hooks: no git repository (or LEFTHOOK=0); skipping");
  process.exit(0);
}

// Resolve the workspace binary directly instead of relying on PATH. pnpm puts
// node_modules/.bin on PATH for lifecycle scripts, but this script is also
// runnable by hand (`node scripts/install-git-hooks.mjs`), where it is not.
const executable = join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "lefthook.cmd" : "lefthook",
);

if (!existsSync(executable)) {
  console.log("install-git-hooks: lefthook is not installed; skipping");
  process.exit(0);
}

try {
  execFileSync(executable, ["install"], { cwd: root, stdio: "inherit" });
} catch {
  // A missing or unwritable .git/hooks directory is not worth failing an
  // install over: the hooks are a convenience, and CI enforces the same checks.
  console.warn("install-git-hooks: could not install hooks; run `pnpm exec lefthook install`");
}
