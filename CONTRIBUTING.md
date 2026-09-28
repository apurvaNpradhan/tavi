# Contributing

Thanks for taking the time to contribute. This document covers how to get the
project running, what is expected of a change, and where the boundaries are.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). To
report a security issue, follow [SECURITY.md](SECURITY.md) instead of opening an
issue.

## What you'll need

- **Node.js 22 or newer**
- **pnpm** — this repository is a pnpm workspace; npm and Yarn will not resolve
  the workspace protocol correctly
- **Docker** — for the local PostgreSQL and object storage
- **Git**

## Getting set up

```bash
cp .env.sample .env
cp apps/api/.env.sample apps/api/.env   # set AUTH_SECRET if you want one
pnpm install

docker compose -f compose.local.yml up -d postgres storage
pnpm --filter @tavi/api db:migrate
pnpm dev
```

`pnpm install` installs the git hooks for you (via the `prepare` script and
[Lefthook](https://lefthook.dev)). If you would rather not run them:
`LEFTHOOK=0 pnpm install`.

The API serves on `:1337` and the web app on `:5173`. [README.md](./README.md) has
the full setup, the environment split between the root `.env` and the per-app
environment files, and the architecture in one pass. Read it before changing
anything structural. For a second git worktree, run
`scripts/setup-dev-worktree.sh`: it gives that worktree its own ports and
database so several can run side by side.

## The process

1. Branch from `main`.
2. Make the change, and test it.
3. Commit using [Conventional Commits](#commit-messages).
4. Open a pull request and fill in the template.

## Commit messages

The `commit-msg` hook enforces conventional commits with commitlint. Use one of
`feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`,
`style`, or `revert`:

```text
fix: reject a workspace id that the caller is not a member of
feat(attachment): stream bytes with a ranged response
docs: correct the integration-test setup command
```

The release workflow derives versions from these prefixes — `fix` is a patch,
`feat` is a minor, and a `!` or `BREAKING CHANGE:` footer is a major — so a
commit that does not parse is dropped from the changelog.

## Before you open a pull request

```bash
pnpm lint           # Oxlint, read-only
pnpm format:check   # Oxfmt, no writes
pnpm typecheck
pnpm test
```

For anything touching the database, storage, authorization, or a row predicate,
also run the integration suite against a disposable database — it applies the
real migrations and truncates between tests:

```bash
DATABASE_URL=postgresql://tavi:tavi@localhost:5432/tavi_test \
S3_ENDPOINT=http://localhost:9002 \
S3_BUCKET=tavi-uploads \
S3_ACCESS_KEY_ID=tavi \
S3_SECRET_ACCESS_KEY=tavi-secret \
S3_REGION=us-east-1 \
  pnpm test:integration
```

That database must be disposable. The suite truncates every table and refuses to
run without `DATABASE_URL` rather than falling back to a default.

Two artifacts are committed and checked in CI, so regenerate them when the
surface they describe changes:

```bash
pnpm openapi:check:fix   # after changing an oRPC procedure
pnpm i18n:check          # after changing user-facing copy
```

## Where code goes

A feature is a directory under `apps/api/src/<domain>/` holding its procedures,
its schemas and its operations. `apps/api/src/router.ts` assembles them into the
router that `packages/libs` turns into the typed client, and `apps/web` calls
that client. There is no code-generation step: change a Zod input or output and
the web app stops compiling until it is updated.

Three rules matter more than the rest, and a change that breaks one will be sent
back:

- **Authorization lives in the API, in middleware.** Compose `authedProcedure`
  with `requireWorkspace(...)`, and resolve the workspace from the resource
  rather than trusting a workspace id from the request. A UI capability check is
  presentation, never enforcement.
- **Mutations publish events.** Anything that changes realtime state publishes
  through `publishEvent`; WebSocket fan-out, notifications and audit entries
  subscribe rather than being called inline.
- **The web data layer has three tiers.** `fetchers/` make the HTTP calls and
  turn a status code into a typed error; `hooks/` own cache keys and
  invalidation; routes and components never fetch directly.

The attachment feature is the worked example of all three, and is kept as a
reference under `_archives/attachment-feature/` (outside the build).

## Database changes

Update the Drizzle schema and relations, then generate and inspect the
migration:

```bash
pnpm --filter @tavi/api db:generate
```

Read the generated SQL before committing it. Check it against a database that
already holds rows — a migration that is correct on an empty schema is not
evidence that it is correct on a populated one.

## Translation copy

`i18n/en-US` is the single source of truth, one file per namespace. When you
change user-facing copy, update the locale file in the same commit.

```bash
pnpm i18n:check      # locale parity
pnpm i18n:report     # keys used in code but missing, and keys defined but unused
pnpm i18n:schema     # regenerate i18n/schema.json
```

`i18n:report` fails on a key that code uses but no locale defines, and on a
dynamic `t(variable)` call it cannot resolve. Prefer static keys; reach for
`i18n:report:fix` to delete keys nothing references.

## Using AI

You are welcome to use AI tools, and the maintainers do. Two boundaries apply to
every contribution.

**Speak for yourself.** Write issues, pull request descriptions and review
replies in your own words. A clear, imperfect explanation beats a generated one
that is longer than the change or does not describe it accurately.

**Think for yourself.** Understand and take responsibility for every line you
submit. Reproduce the problem, reduce the fix to its necessary scope, and verify
the behaviour yourself. You should be able to explain the design decisions,
tradeoffs and tests without relying on a generated answer.

AI output is not evidence that a change is correct. Behaviour changes need a
test that fails without them, and a pull request should not carry unrelated or
speculative work. Addressing bot review comments is fine; they identify
problems, they do not replace your own investigation.

A pull request may be closed without a detailed review when its description is
inaccurate, its scope exceeds the linked issue, important behaviour is untested,
or the author cannot explain and validate the work.

## Reporting bugs and requesting features

Use the issue templates. For a bug, the reproduction steps matter far more than
the prose — a report that can be reproduced is worth ten that cannot.
