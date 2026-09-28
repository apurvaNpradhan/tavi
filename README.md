# Tavi — application template

This checkout has Tavi source identities. Before deploying or distributing it,
follow the [identity cutover notes](docs/identity-cutover.md) for external
OAuth, Sentry, domain, and database setup.

A production-shaped starting point for a multi-tenant web app, extracted from the
architecture of [Kaneo](https://kaneo.app).

Authentication, workspaces, invitations, member management, and an in-app
notification example are implemented across the API and web app. Invitation
acceptance creates a notification for the inviter. The notification example
is a small, removable feature, not a general delivery system. It has no email,
WebSocket, or notification-preference delivery path. Invitation emails are a
separate feature and require configured Resend credentials.

Local development should use a fresh Tavi database unless you intentionally
migrate existing data. Before deploying or distributing this clone, follow the
[identity cutover notes](docs/identity-cutover.md).

## Stack

| Layer         | Choice                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------- |
| Monorepo      | pnpm workspaces + Turborepo                                                                 |
| API           | Hono shell + **oRPC** procedures, served as RPC (`/api/rpc`) and REST/OpenAPI (`/api`)      |
| API reference | Scalar at `/api/reference`, rendering the live OpenAPI document                             |
| Auth          | Better Auth (magic link, OTP, OAuth, API keys, device flow, admin, organizations)           |
| Tenancy       | Better Auth _organizations_ relabelled as **workspaces**, with per-workspace editable roles |
| Database      | PostgreSQL via Drizzle ORM (`drizzle-kit` migrations)                                       |
| Email         | React Email + Resend                                                                        |
| Web           | React 19 + Vite + TanStack Router + TanStack Query                                          |
| Styling       | Tailwind CSS v4 + Base UI (coss-style `useRender` components)                               |
| Quality       | Oxlint + Oxfmt, Vitest, TypeScript strict                                                   |

## Getting started

```bash
# Root .env feeds the Docker services; the app env files are separate.
cp .env.sample .env
cp apps/api/.env.sample apps/api/.env   # then set AUTH_SECRET if you want one
pnpm install

docker compose -f compose.local.yml up -d postgres

pnpm --filter @tavi/api db:migrate
pnpm dev                     # api on :1337, web on :5173
```

**Upgrading an existing database.** Take a PostgreSQL backup and rehearse the
upgrade on a copy before deploying. The original `0000` Drizzle migration is
retained so installed databases advance to `0001` and later migrations rather
than replaying the baseline. `0001` deliberately drops the removed notes,
attachments, tags, and activity tables and their data. Export those records
before upgrading if you need them. Treat the backup as the rollback path;
reverting the application image cannot restore dropped tables.

**Environment split.** The root `.env` is for Docker Compose services only
(`compose.yml`, `compose.dokploy.yml`). The API reads `apps/api/.env` (loaded by
`@tavi/env/server`, which loads and validates all server variables); the web
app reads `apps/web/.env*` (only `VITE_` variables reach the browser). A missing
`AUTH_SECRET` in development generates one and persists it to `.auth-secret`.

The local stack runs as the compose project `tavi-local`, deliberately
separate from the bundled `compose.yml` stack. Sharing a project name would make
the two files fight over one Postgres container (different port mapping) and one
volume — and `docker compose -f compose.yml down -v` would then wipe the
database dev is using.

The first account you create becomes the instance administrator. Signing in
without a workspace lands on `/onboarding`, which creates one (and is where the
dashboard sends you whenever you have none).

Useful commands:

```bash
pnpm lint                    # Oxlint, read-only; includes React, Vitest, TanStack Query and anti-slop
pnpm lint:fix                # apply safe lint fixes
pnpm format                  # Oxfmt, writes files
pnpm format:check            # check formatting without writes
pnpm typecheck               # every package
pnpm build                   # every package
pnpm test
pnpm --filter @tavi/api db:generate   # after schema changes
pnpm openapi:check:fix                   # after route changes
```

Oxlint and Oxfmt use root configs. The anti-slop plugin is vendored in
`tools/oxlint/anti-slop/` with its upstream revision recorded there. The VS Code
workspace recommends the Oxc extension and enables formatting and safe fixes on
save. Install the recommendation when VS Code prompts you.

### Working in multiple worktrees

Every git worktree needs its own environment files and, to run more than one at
a time, its own ports and database. `scripts/setup-dev-worktree.sh` does all of
it:

```bash
scripts/setup-dev-worktree.sh
```

Shared secrets live once in `~/.config/tavi/dev.env` (mode 600, seeded from the
canonical checkout on first run). The script then gives the worktree the lowest
free port slot — `1337+n` for the API, `5173+n` for the web app, and `8081+n` for
Expo's Metro bundler — plus a `tavi_<worktree>` database, and writes them into
`apps/api/.env`, `apps/web/.env.development.local`, and `apps/native/.env.local`.
It installs dependencies, applies migrations, and can start `pnpm dev`. Re-running
reuses the same slot, so worktrees do not collide and the web dev server fails
loudly rather than shifting ports (it reads `VITE_DEV_PORT` with `strictPort`).
The native env asks for the API host reachable from your device (localhost, the
Android emulator's `10.0.2.2`, or your LAN IP) and remembers it.

Google sign-in is bound to the port its OAuth client has registered; the script
prints the redirect URI to add for the worktree's API port.

## Native app

`apps/native/` is the Expo Router app for iOS and Android. It uses the same Better Auth server, typed oRPC router, TanStack Query, and translation files as the web app. It does not add API feature routes or a separate backend.

```bash
cp apps/native/.env.example apps/native/.env.local
pnpm --filter native start
```

Set `EXPO_PUBLIC_API_URL` to the API origin. `localhost` works in the iOS simulator; Android emulators use `http://10.0.2.2:1337`. A physical device needs the developer machine's reachable LAN address for both API and web URLs, and those services must be reachable from that device. Set `EXPO_PUBLIC_WEB_URL` to the web app origin used by the "Manage on web" action.

The native app supports email OTP and Google when enabled by the API runtime configuration. The API includes Better Auth's Expo plugin and trusts the `tavi://` callback scheme. Test OTP in Expo Go; test Google OAuth in an iOS or Android development build with the API provider credentials configured. Do not add Expo development origins to production trusted origins.

The app stores Better Auth session data with Expo SecureStore and forwards its session cookie on typed oRPC calls. Query data stays in memory and is cleared on sign-out. Mobile onboarding handles profile name and workspace creation; if workspace creation is disabled and the user has no invitation, the app offers a web handoff.

Localization uses `expo-localization` and the shared `i18n/` resources. Only `en-US` is currently shipped. The saved account locale wins when supported; otherwise the app uses the first supported device locale.

Native Sentry reporting is disabled unless `EXPO_PUBLIC_SENTRY_DSN` is set. Production source-map upload requires `NODE_ENV=production` and `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in the build environment. Keep the upload token out of app config and the application bundle. The app reports errors and crashes only; replay and tracing are explicitly disabled.

The current development identifiers are `com.tavi.app.dev` on both platforms. Choose production identifiers and configure signing for the chosen release path before distribution.

## Layout

```text
apps/
  api/    oRPC router + procedures, raw Hono routes, auth, events
  web/    React SPA: thin routes, feature slices, shared clients and UI
  native/ Expo Router app: thin routes, feature slices, shared platform code
packages/
  libs/          Shared oRPC client types and workspace utilities
  permissions/   Permission vocabulary shared by API and web
  email/         React Email templates + Resend transport
  env/           @t3-oss/env Zod schemas: ./server (API/email) and ./web (Vite)
  typescript-config/
i18n/            English source locale + <locale>/<namespace>.json extensions
scripts/i18n/    Locale drift checker + schema generator
tests/           Unit and integration tests
docs/             Architecture and agent documentation
```

## The architecture in one pass

**The typed client connects the API and app.** `apps/api/src/router.ts` assembles every
feature router into one oRPC router and exports `ApiRouter`. `packages/libs`
imports that type to build the client, and `apps/web` talks to `/api/rpc` through
it. There is no code generation step: change a Zod input or output in the API and
the web app fails to compile until it is updated. The same router is served
through an `OpenAPIHandler`, so the REST surface and the generated `openapi.json`
cannot drift from the typed one.

**A feature is a directory.** Retained features have `procedures.ts` for
oRPC handlers and OpenAPI metadata, and put database work under `operations/`.
Input schemas may be inline in `procedures.ts` or live in `schemas.ts`; output
schemas live in `output.ts` or `schemas.ts`. The `team/` feature shows a
resource-derived workspace authorization check. Add `.use(requireWorkspace(...))`
after `.input(...)` so the resolver receives validated input.

**Authorization is three layers, in middleware.** Better Auth owns credential
routes and organization plumbing. It does not authorize oRPC procedures.
`authedProcedure` (`orpc/base.ts`) resolves the session or API key. Workspace
procedures add `requireWorkspace(resolveWorkspaceId, { workspace: ["read"] })`
(`orpc/workspace.ts`) to prove membership and check the role's capability map from
`@tavi/permissions`. The workspace is resolved from the resource being acted
on, never trusted from a client-supplied id. A procedure that does not compose
`authedProcedure` is public by construction, and its OpenAPI metadata declares
`security: []` so the document says so too; this keeps the base builders the only
thing domains build from.

**Mutations publish events for side effects.** The API registers an in-process
subscriber for `invitation.accepted`. When the membership row is inserted while
the invitation is accepted, a PostgreSQL trigger inserts the inviter's in-app
notification in that same database transaction. The event subscriber also
projects a notification and shares the same unique recipient/invitation key, so
the duplicate path is idempotent. The process-local event bus is not durable;
other subscribers have no cross-instance or durable delivery guarantee.

**Web and native code is grouped by behavior.** Web screens, queries, mutations,
rules, and tests live together in `apps/web/src/features/<feature>/`. Native
authentication, onboarding, and workspace code lives under
`apps/native/features/<feature>/`. TanStack Router's `routes/` and Expo Router's
`app/` retain their framework-required file trees and delegate to those slices.
Shared clients, i18n, and reusable UI live under each app's `shared/` directory.
A feature owns its cache keys and invalidation; another feature imports its
public operations rather than reaching into private implementation files.
Neither app duplicates API authorization. The API feature routers remain under
`apps/api/src/<domain>/`, with server-wide HTTP, oRPC, auth, and database setup
outside those directories.

## Feature routers

`apps/api/src/router.ts` mounts one feature router per domain:

| Router     | Operations (REST path)                                                                              | Scope                                  |
| ---------- | --------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `instance` | `getStatus` (`GET /instance/status`)                                                                | public                                 |
| `config`   | `get` (`GET /config`)                                                                               | public                                 |
| `user`     | `getCurrentUser` (`GET /user/me`); `uploadAvatar` / `deleteAvatar` (`POST` / `DELETE /user/avatar`) | authenticated user                     |
| `team`     | `getSummary` (`GET /team/{teamId}`)                                                                 | workspace member with `workspace.read` |

The `invitation`, `member`, `workspaceRole`, and `notification` routers cover
invitation and membership management, workspace role lookup, and the in-app
notification inbox. Their procedures are exposed through the typed client and
OpenAPI document.

Raw Hono routes cover what oRPC does not model: `/health`, Better Auth under
`/auth/*`, the public immutable avatar binary at `/user/avatar/{id}`, the OpenAPI
document at `/openapi`, and the Scalar reference at `/api/reference`.

To add your own domain, follow a retained directory (for example
`apps/api/src/team/` for a workspace-scoped read), register its router in
`apps/api/src/router.ts`, and put the web screen, queries, mutations, and tests
under one `apps/web/src/features/<feature>/` directory.

The attachment example is not retained in this checkout. Use
`apps/api/src/team/` for a small workspace-scoped read,
`apps/api/src/invitation/` for authorized workspace management procedures, or
`apps/api/src/notification/` for the event-backed in-app notification example.
Build new features under `apps/api/src/<domain>/` and keep procedures, schemas,
operations, and tests with that domain.

## Realtime

The current event bus (`apps/api/src/events/`) runs in one API process. The
accepted-invitation notification is inserted by a PostgreSQL trigger on the
membership write inside the acceptance transaction; the event subscriber also
attempts an idempotent insert after acceptance commits. The web app reads the row through authenticated
procedures. There is no WebSocket or cross-instance event delivery, durable
outbox, email notification, or user preference system. Treat this notification
slice as an example to keep or remove, not as a delivery guarantee.

## Deliberate deviations from Kaneo

- **TypeScript is pinned to the 5.9 line, not 7.x.** Kaneo tracks the native Go
  compiler, which ships no `lib.*.d.ts` files; any JS-based language service
  (VS Code, most editors' TS servers) then type-checks against ES5 defaults and
  reports false errors in every file. The stable compiler behaves identically
  for this code and keeps editor tooling honest.
- **No Redis.** Event delivery is an in-process `EventEmitter`. It reaches
  subscribers in this Node process only, is not durable, and is lost on restart;
  add a real queue or shared transport before running multiple API instances.
- **No marketing site, docs app, MCP server, billing or Helm chart.** Those are
  product surfaces, not building blocks.
- **Marketplace integrations (GitHub/Gitea/Slack/…) are omitted.** The plugin
  registry pattern they used is worth revisiting when you need it.

## Testing

Two suites with different jobs:

```bash
pnpm test              # unit — no external services
pnpm test:integration  # against a throwaway PostgreSQL
```

**Unit** (`tests/api/`, plus `apps/api/src/**/*.test.ts` colocated where a module needs
its exact dependency resolution) covers pure logic: the SSRF guard, cookie
attributes, permission payload parsing, and URL resolution.

**Integration** (`tests/api-integration/`) runs against real PostgreSQL, because
a whole class of bug passes every unit test and only appears against real
infrastructure — a predicate that matches no rows, a cascade that does not fire,
a role check reading the wrong table. It applies the actual migrations (so a
broken migration fails the suite) and truncates between tests.

```bash
docker compose -f compose.local.yml up -d postgres
docker compose -f compose.local.yml exec -T postgres \
  psql -U tavi -d postgres -c "create database tavi_test"

DATABASE_URL=postgresql://tavi:tavi@localhost:5432/tavi_test \
  pnpm test:integration
```

`DATABASE_URL` must point at a disposable database — the suite truncates every
table and refuses to run without it rather than falling back to a default.

## Guardrails

Two artifacts are committed and checked in CI, so a change to the API or the
copy cannot silently drift:

- `openapi.json` — regenerated from the served route (not re-derived), so it
  always matches what the API actually returns. `pnpm openapi:check:fix`. The
  Scalar reference at `/api/reference` renders this same document.
- `i18n/schema.json` + locale parity — `en-US` is the only shipped locale and
  source of truth today. `pnpm i18n:schema` regenerates the key surface;
  `pnpm i18n:check` validates every source namespace and, when another locale
  is added to `i18n/resources.ts`, checks its keys and interpolation placeholders.
  Add a locale by registering it there, adding `i18n/<locale>/<namespace>.json`
  files, and keeping feature namespace imports lazy in `i18n/resources.ts`.

## Verified end to end

The template was smoke-tested against a real stack (`docker compose up`), not
just type-checked. Confirmed working through nginx and Postgres:

| Check                                                    | Result |
| -------------------------------------------------------- | ------ |
| Migrations apply at boot                                 | ✅     |
| First signup is promoted to instance administrator       | ✅     |
| Session cookie authenticates subsequent requests         | ✅     |
| Workspace creation seeds `viewer`/`member`/`admin` roles | ✅     |
| Instance administrator bypasses workspace roles          | ✅     |
| Unauthenticated request denied (401)                     | ✅     |
| SPA served with client-side routing fallback             | ✅     |
| Hashed assets cached immutably                           | ✅     |
| API survives a PostgreSQL restart                        | ✅     |

Three operational details this surfaced, all fixed here:

- **nginx must re-resolve the API container.** A literal `proxy_pass http://api:1337`
  caches the address at startup, so recreating the API container leaves the
  proxy returning 502 until nginx reloads. `nginx.conf` resolves it through a
  variable via Docker's DNS instead.
- **The public origin must be configured for cookies to work.** If the API's own
  origin and the browser's origin differ, cookies are issued `SameSite=None;
Secure`, which a plain-HTTP setup cannot store. Set `TAVI_PUBLIC_URL` to the
  address the browser uses and both `TAVI_CLIENT_URL`/`TAVI_API_URL` follow it.
- **A `pg` pool needs an `error` listener.** `pg` emits `error` on the pool when
  an _idle_ client loses its connection; with no listener that is an unhandled
  event and Node terminates the process, so an ordinary database restart took
  the API down and left it down. `getDatabasePool` now handles it, discards the
  dead client and reconnects, and
  `tests/api-integration/database-resilience.test.ts` terminates the backends to
  keep it that way.

## Email preview

```bash
pnpm --filter @tavi/email dev   # http://localhost:3002
```

Delivery uses [Resend](https://resend.com). Set `RESEND_API_KEY` and
`RESEND_FROM_EMAIL`; the from-address must be on a domain verified in Resend —
add the DNS records the dashboard shows and wait for verification to finish.
Without both values the API boots normally and reports email as unconfigured,
so invitations and account-deletion confirmations stay unavailable.

## Deploying

Two compose files ship with the template:

- **`compose.yml`** — bundled single-origin stack: Postgres, API, nginx. The
  root `.env` provides `POSTGRES_*`, `AUTH_SECRET`, `TAVI_PUBLIC_URL`, and
  the optional `RESEND_*`/`SENTRY_DSN` values.
- **`compose.dokploy.yml`** — same API + web pair but **no Postgres service**:
  set `DATABASE_URL` in the root `.env` to a separate managed PostgreSQL
  service (e.g. a Postgres app on Dokploy). `AUTH_SECRET` and
  `TAVI_PUBLIC_URL` work exactly as in the bundled file. Volume-less: the
  database is external, so `down -v` cannot destroy anything.

```bash
docker compose up -d                     # bundled stack
cp .env.sample .env                      # then set DATABASE_URL + AUTH_SECRET
docker compose -f compose.dokploy.yml up -d
```

react-email requires a **default export** in each template file. Without one the
preview server reports "does not contain a default exported function" and lists
nothing — so every template in `src/templates/` default-exports its component and
also exports `PreviewProps` with sample data. `src/components/email-shell.tsx`
holds the shared layout and sits outside `src/templates/` on purpose: anything in
that directory is treated as a previewable email.

## Not yet wired

- **Domain event subscribers.** The in-process event bus has a subscriber for
  `invitation.accepted`; the workspace lifecycle publishes `workspace.created`,
  but no subscriber consumes it.
