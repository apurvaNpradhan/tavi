# syntax=docker/dockerfile:1

# --- build -------------------------------------------------------------------
FROM node:26-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
WORKDIR /app

# Manifests first so a source-only change reuses the dependency layer. The root
# `prepare` script is part of the manifest contract: `pnpm install` runs it, so
# its entrypoint must exist in the context or the install fails to resolve it.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY scripts/install-git-hooks.mjs ./scripts/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/permissions/package.json ./packages/permissions/
COPY packages/libs/package.json ./packages/libs/
COPY packages/email/package.json ./packages/email/
COPY packages/env/package.json ./packages/env/
COPY apps/api/package.json ./apps/api/

# The store lives in a BuildKit cache mount so retries after a registry stall
# resume instead of re-downloading the whole lockfile. Concurrency is capped
# because a build container's egress is slower than the host's: the default 16
# parallel downloads can starve a single large tarball into a timeout.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store --fetch-retries=5 \
      --network-concurrency=4 --fetch-timeout=300000

COPY packages/typescript-config ./packages/typescript-config
COPY packages/permissions ./packages/permissions
COPY packages/libs ./packages/libs
COPY packages/email ./packages/email
COPY packages/env ./packages/env
COPY apps/api ./apps/api

# Workspace packages the API imports at runtime must be compiled first, in
# dependency order: @tavi/email imports @tavi/env/server, so env has
# to emit its declarations before email is built.
RUN pnpm --filter @tavi/env build \
 && pnpm --filter @tavi/permissions build \
 && pnpm --filter @tavi/email build \
 && pnpm --filter @tavi/api build

# --- production dependencies -------------------------------------------------
FROM node:26-alpine AS prod-deps

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY scripts/install-git-hooks.mjs ./scripts/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/permissions/package.json ./packages/permissions/
COPY packages/libs/package.json ./packages/libs/
COPY packages/email/package.json ./packages/email/
COPY packages/env/package.json ./packages/env/
COPY apps/api/package.json ./apps/api/

# Hooks are pointless in an image, and `.git` is not copied into the build
# context, so the prepare script is told to skip rather than failing the build.
# The script itself still has to be present for `pnpm install` to resolve it.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    LEFTHOOK=0 pnpm install --prod --frozen-lockfile --no-optional --store-dir=/pnpm/store --fetch-retries=5 \
      --network-concurrency=4 --fetch-timeout=300000

# --- runtime -----------------------------------------------------------------
FROM node:26-alpine AS runtime

RUN addgroup -g 1001 appuser \
 && adduser -u 1001 -G appuser -D appuser \
 && mkdir -p /app && chown -R appuser:appuser /app

WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps --chown=appuser:appuser /app ./
COPY --from=builder --chown=appuser:appuser /app/apps/api/dist ./apps/api/dist
# Migrations are applied at boot, so the SQL must ship with the image.
COPY --from=builder --chown=appuser:appuser /app/apps/api/drizzle ./apps/api/drizzle
COPY --from=builder --chown=appuser:appuser /app/packages/email/dist ./packages/email/dist
COPY --from=builder --chown=appuser:appuser /app/packages/email/package.json ./packages/email/
COPY --from=builder --chown=appuser:appuser /app/packages/permissions/dist ./packages/permissions/dist
COPY --from=builder --chown=appuser:appuser /app/packages/permissions/package.json ./packages/permissions/
COPY --from=builder --chown=appuser:appuser /app/packages/env/dist ./packages/env/dist
COPY --from=builder --chown=appuser:appuser /app/packages/env/package.json ./packages/env/

USER appuser
WORKDIR /app/apps/api
EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:1337/api/health || exit 1

CMD ["node", "--enable-source-maps", "dist/index.js"]
