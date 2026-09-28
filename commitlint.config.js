/**
 * Conventional Commits, enforced by the `commit-msg` hook in `lefthook.yml`.
 *
 * The release workflow derives versions from these prefixes: `fix:` is a patch,
 * `feat:` is a minor, and any `!` or `BREAKING CHANGE:` footer is a major. A
 * commit that does not parse is silently dropped from the changelog rather than
 * failing the release, so the hook is what keeps the history releasable.
 */
export default { extends: ["@commitlint/config-conventional"] };
