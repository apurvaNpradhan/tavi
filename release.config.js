/**
 * semantic-release configuration.
 *
 * `.github/workflows/release.yml` is the only caller. It runs this twice: once
 * with `--dry-run` to resolve the next version before anything is published,
 * then for real. Nothing here publishes a package — the repository is private
 * and releases are a tag, a changelog entry and a GitHub Release.
 *
 * Plugin order matters. `prepare` steps run in array order, so the changelog
 * has to be written and the version applied *before* `@semantic-release/git`
 * commits, otherwise the release commit contains the previous version.
 *
 * `RELEASE_TYPE` (auto|patch|minor|major) forces a bump instead of deriving it
 * from the commit history, which is what the workflow's dispatch input sets.
 */
const forced = process.env.RELEASE_TYPE;
const forcedBump = forced && forced !== "auto" ? forced : null;

export default {
  branches: ["main"],
  plugins: [
    // `conventionalcommits` is a separate preset package; the default preset
    // does not understand the `!` breaking-change marker.
    forcedBump
      ? { analyzeCommits: () => forcedBump }
      : ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],

    ["@semantic-release/release-notes-generator", { preset: "conventionalcommits" }],

    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],

    [
      "@semantic-release/exec",
      {
        // A dry run still executes verifyRelease, which is how the workflow
        // learns the version before it decides whether to release at all.
        verifyReleaseCmd: "node scripts/release/emit-version.mjs ${nextRelease.version}",
        prepareCmd: "node scripts/release/apply-version.mjs ${nextRelease.version}",
      },
    ],

    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        // [skip ci] keeps the release commit from re-triggering CI, which would
        // otherwise run the whole suite against a commit that only bumps a
        // version number.
        message: "chore(release): v${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],

    "@semantic-release/github",
  ],
};
