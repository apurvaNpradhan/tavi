# syntax=docker/dockerfile:1

# --- build -------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
WORKDIR /app

# The root `prepare` script runs on every `pnpm install`, so its entrypoint has
# to exist in the build context or the install fails to resolve it.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY scripts/install-git-hooks.mjs ./scripts/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/permissions/package.json ./packages/permissions/
COPY packages/libs/package.json ./packages/libs/
COPY packages/env/package.json ./packages/env/
COPY apps/web/package.json ./apps/web/
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
COPY packages/env ./packages/env
COPY i18n ./i18n
COPY apps/web ./apps/web
# The typed client consumes the API's route types, so the API source is needed
# at build time (types only — nothing from it ships in the image).
COPY apps/api ./apps/api

RUN pnpm --filter @tavi/permissions build \
 && pnpm --filter @tavi/web build

# --- runtime -----------------------------------------------------------------
FROM nginx:1.29-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1
