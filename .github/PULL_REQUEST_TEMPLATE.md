## Description

<!-- What changed, and why. A short paragraph is enough. -->

## Related issue

<!-- Link the issue this resolves, or delete this section. -->

Closes #

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation
- [ ] Refactor (no behaviour change)
- [ ] Performance
- [ ] Tests
- [ ] Other:

## How this was verified

<!--
Name the commands you ran and what they covered. "Ran pnpm test" is less
useful than "pnpm test, plus pnpm test:integration for the new row predicate".
Say explicitly what you did NOT verify.
-->

- [ ] `pnpm lint`
- [ ] `pnpm format:check`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm test:integration` (requires a throwaway PostgreSQL)
- [ ] Manual check against a running stack

## Database changes

<!-- Delete this section if the change touches no schema. -->

- [ ] `pnpm --filter @tavi/api db:generate` run, and the generated SQL
      inspected against an existing database
- [ ] Migration applies cleanly to a database with existing rows

## Checklist

- [ ] New and existing tests pass locally
- [ ] Behaviour changes come with a test that fails without the change
- [ ] `openapi.json` regenerated if the API surface changed (`pnpm openapi:check:fix`)
- [ ] `i18n/en-US` updated in the same commit if user-facing copy changed
- [ ] Documentation updated where it describes the changed behaviour

## Notes for the reviewer

<!--
Anything that helps: a decision you were unsure about, a tradeoff you made, an
area you would like a second opinion on.
-->
