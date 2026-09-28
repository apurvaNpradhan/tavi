# Agent guide

## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Use a single root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

Tavi is a multi-tenant app template. Its oRPC API owns domain behavior and authorization; the React app uses the typed client. PostgreSQL stores durable state. The in-process event bus currently feeds an in-app notification for `invitation.accepted`; it does not provide durable or cross-instance delivery. User instructions take precedence over this guide.

## Start here

- Use pnpm, not npm or Bun. Read the code you are changing before copying a pattern.
- For setup, service configuration, architecture, and integration-test prerequisites, use [README.md](README.md). Check scripts in `package.json` before running them.
- For API or workspace changes, inspect `apps/api/src/orpc/`, `apps/api/src/router.ts`, and the live feature closest to the change: `apps/api/src/team/`, `apps/api/src/invitation/`, `apps/api/src/notification/`, or `apps/api/src/user/`. For workspace invitations and member management, also inspect the matching web route and `apps/web/src/features/invitations/` or `apps/web/src/features/notifications/`.
- For web work, inspect `apps/web/src/shared/api/api-client.ts` and the affected feature under `apps/web/src/features/`. For visual work, use [DESIGN.md](DESIGN.md), `apps/web/src/index.css`, and the UI components under `apps/web/src/shared/ui/`.

## Boundaries

- The API enforces authorization. Workspace procedures compose `authedProcedure` with `requireWorkspace(...)` using `@tavi/permissions`; resolve the workspace from the resource when it owns one, rather than trusting a supplied workspace ID. UI capability checks do not replace API checks.
- Public procedures use `publicProcedure`. Raw public Hono routes belong above the oRPC catch-all in `createApp()` and declare `security: []`.
- Keep secrets, credentials, and private workspace data out of responses, logs, events, and WebSockets. Publish events for mutations that need registered in-process side effects; check whether a durable delivery path is required.
- Use Zod inputs and outputs for procedures. Keep authorization in middleware and expected domain failures as `HTTPException`; the oRPC base middleware translates them.
- Use the client from `@tavi/libs` and the existing oRPC/TanStack Query integration in the web app. Do not introduce another HTTP client for API procedures. Build UI primitives on Base UI with `useRender`/`mergeProps` and the `render` prop.

## Follow through and verify

- For behavior changes, check the applicable procedure, schemas, operations, permission checks, OpenAPI metadata, typed client, UI state and cache behavior, events, and notification effects. The current event bus is in-process and has no durable outbox. For configuration changes, update README and `.env.sample` where needed.
- For database changes, update Drizzle schema and relations, run `pnpm --filter @tavi/api db:generate`, and inspect the SQL against an existing database. Test row predicates, authorization and migrations in `tests/api-integration/` against disposable services; see README for setup. Unit tests alone do not cover those paths.
- Start with the narrowest relevant test or package check. Package typechecks: `pnpm --filter @tavi/api typecheck` and `pnpm --filter @tavi/web typecheck`. Broader gates: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build`, `pnpm test`; `pnpm test:integration` requires a throwaway PostgreSQL. Report what ran and what did not.
