import "./instrument";
import { logger } from "hono/logger";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { SmartCoercionHandlerPlugin } from "@orpc/json-schema";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { Scalar } from "@scalar/hono-api-reference";
import * as Sentry from "@sentry/node";
import { env } from "@tavi/env/server";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { ApiHonoEnv } from "./api-context";
import { auth } from "./auth";
import { closeDatabase, getDatabase } from "./database";
import { prepareDatabaseStartup } from "./database/prepare-database-startup";
import { waitForDatabase } from "./database/wait-for-database";
import { shutdownEventBus } from "./events";
import { buildApiDocument } from "./openapi-document";
import { createRoute } from "./openapi";
import { router } from "./router";
import { registerNotificationEventHandlers } from "./notification/events";
import { registerUserAvatarRoute } from "./user/avatar-route";
import { clientIpMiddleware } from "./utils/client-ip";
import { seedDefaultWorkspaceRoles } from "./utils/seed-default-workspace-roles";

/**
 * Builds the entire HTTP surface.
 *
 * Ordering is load-bearing:
 *  1. transport concerns (client IP, error shaping, CORS, gzip);
 *  2. public and exceptional routes that must work before authentication;
 *  3. the oRPC handlers, which own authentication and authorization for every
 *     procedure.
 *
 * The oRPC catch-all is registered last so that raw routes (Better Auth, avatar
 * downloads, the OpenAPI document) always win. A new
 * procedure cannot bypass the authentication middleware because it is applied
 * by `authedProcedure`, and a raw route that needs auth must opt in explicitly —
 * there is no global middleware to inherit it from.
 */
export function createApp() {
  registerNotificationEventHandlers();
  const app = new Hono();
  app.use(logger());
  app.use("*", clientIpMiddleware());

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      // 4xx are expected control flow and are not reported.
      if (err.status >= 500) {
        Sentry.captureException(err);
      }
      return err.getResponse();
    }

    Sentry.captureException(err);
    return c.json({ message: "Internal Server Error" }, 500);
  });

  const corsOriginSource = [env.CORS_ORIGINS, env.TAVI_CLIENT_URL].find((value) => value?.trim());
  const corsOrigins = corsOriginSource
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Reflecting arbitrary origins with credentials enabled would let any site
  // read authenticated responses, so it is a development-only convenience.
  const reflectUnconfiguredOrigins = env.NODE_ENV !== "production";

  if (!corsOrigins && !reflectUnconfiguredOrigins) {
    console.warn(
      "[cors] Neither CORS_ORIGINS nor TAVI_CLIENT_URL is set, so cross-origin requests are refused. Same-origin setups are unaffected.",
    );
  }

  app.use(
    "*",
    cors({
      credentials: true,
      origin: (origin) => {
        if (!corsOrigins) {
          return reflectUnconfiguredOrigins ? origin || "*" : null;
        }
        if (!origin) return null;
        return corsOrigins.includes(origin) ? origin : null;
      },
    }),
  );

  // Responses can be large, repetitive JSON; gzip is a large win for very
  // little cost.
  app.use(compress());

  const api = new OpenAPIHono<ApiHonoEnv>();

  const rpcHandler = new RPCHandler(router);
  const openApiHandler = new OpenAPIHandler(router, {
    plugins: [
      new SmartCoercionHandlerPlugin({
        converters: [new ZodToJsonSchemaConverter()],
      }),
    ],
  });

  api.get("/health", (c) => c.json({ status: "ok" }));

  api.openapi(
    createRoute({
      method: "get",
      operationId: "getSession",
      path: "/auth/get-session",
      tags: ["Authentication"],
      summary: "Get session",
      description:
        "The current session, or null when the caller is not signed in. Served by Better Auth.",
      security: [],
      responses: { 200: { description: "Session details, or null" } },
    }),
    async (c) => auth.handler(c.req.raw),
  );

  registerUserAvatarRoute(api);

  api.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    description: "API key or session token (Bearer)",
  });

  api.get("/openapi", async (c) => {
    // The raw routes above cannot be described by the oRPC router, so their
    // operations are merged into the generated document instead of being
    // dropped. `buildApiDocument` also injects the shared 401.
    const rawDocument = api.getOpenAPI31Document({
      openapi: "3.1.0",
      info: { title: "Tavi API", version: "1.0.0" },
      security: [{ bearerAuth: [] }],
    });

    return c.json(await buildApiDocument(rawDocument.paths ?? {}));
  });

  // Interactive reference for the document above. Registered next to
  // `/openapi` and therefore public. The spec URL is the browser-visible path,
  // which includes the `/api` mount.
  api.get(
    "/reference",
    Scalar({
      url: "/api/openapi",
      pageTitle: "Tavi API reference",
    }),
  );

  // Better Auth owns every /auth/* path (sign-in, OAuth callbacks, device flow,
  // organizations, API keys).
  api.on(["POST", "GET", "PUT", "PATCH", "DELETE"], "/auth/*", (c) => auth.handler(c.req.raw));

  // -------------------------------------------------------------------------
  // oRPC
  // -------------------------------------------------------------------------

  // RPC protocol for the typed browser client. Authentication is owned by the
  // procedures (`authedProcedure`), not by this transport.
  api.all("/rpc/*", async (c) => {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: "/api/rpc",
      context: { headers: c.req.raw.headers },
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    return c.notFound();
  });

  // OpenAPI/REST protocol for the same router, mounted at /api so the existing
  // endpoint paths are preserved.
  api.all("/*", async (c) => {
    const { matched, response } = await openApiHandler.handle(c.req.raw, {
      prefix: "/api",
      context: { headers: c.req.raw.headers },
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    return c.notFound();
  });

  app.route("/api", api);

  return { app, api };
}

/**
 * Everything that must happen before the server accepts traffic.
 *
 * Split out so integration tests can run the identical sequence against a
 * throwaway database without binding a port.
 */
export async function runStartupTasks(): Promise<void> {
  const currentDir = dirname(fileURLToPath(import.meta.url));

  await prepareDatabaseStartup({
    waitForDatabase: async () => {
      await waitForDatabase({
        query: async () => {
          await getDatabase().execute(sql`SELECT 1`);
        },
      });
    },
    runStartupMigrations: async () => {
      console.log("🔄 Applying database migrations...");
      await migrate(getDatabase(), {
        migrationsFolder: `${currentDir}/../drizzle`,
      });

      // Idempotent backfills that must also work on an existing database go
      // here, after the generated migrations and before serving traffic.
      await seedDefaultWorkspaceRoles();
      console.log("✅ Database ready");
    },
  });
}

export async function startServer(port = env.PORT): Promise<void> {
  try {
    await runStartupTasks();
  } catch (error) {
    console.error("❌ Startup failed:", error);
    process.exit(1);
  }

  let shuttingDown = false;

  const server = serve({ fetch: app.fetch, port }, () => {
    console.log(`⚡ API listening on ${env.TAVI_API_URL || `http://localhost:${port}`}`);
  });

  const gracefulShutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log("🛑 Shutting down...");
    const deadline = setTimeout(() => {
      console.error("Shutdown timed out while draining requests");
      process.exit(1);
    }, 10_000);

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await shutdownEventBus();
      await closeDatabase();
      clearTimeout(deadline);
      process.exit(0);
    } catch (error) {
      clearTimeout(deadline);
      console.error("Shutdown failed:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void gracefulShutdown());
  process.on("SIGINT", () => void gracefulShutdown());
}

const createdApp = createApp();

const { app } = createdApp;

const entrypoint = process.argv[1];
const isMainModule =
  entrypoint !== undefined &&
  entrypoint !== "" &&
  import.meta.url === pathToFileURL(entrypoint).href;

if (isMainModule) {
  void startServer();
}

export default app;
