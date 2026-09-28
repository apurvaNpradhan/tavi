import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { env } from "@tavi/env/server";
import { normalizeApiServerUrl } from "./openapi";
import { router } from "./router";

/** Path-item map shared by the oRPC generator and Hono's OpenAPI output. */
type OpenApiPaths = Record<string, unknown>;

type OpenApiOperation = {
  security?: unknown[];
  responses?: Record<string, unknown>;
};

const openApiGenerator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
});

/**
 * Adds the shared 401 response to every authenticated operation.
 *
 * Public operations opt out with `security: []` in their OpenAPI metadata, so
 * this mirrors the rule the previous document used: no `security` array, or a
 * non-empty one, means the operation is authenticated.
 */
function injectUnauthorizedResponses(paths: OpenApiPaths): void {
  const methods = new Set(["get", "post", "put", "delete", "patch", "options", "head", "trace"]);

  for (const operations of Object.values(paths)) {
    if (!operations || typeof operations !== "object") continue;

    for (const [method, operation] of Object.entries(operations)) {
      if (!methods.has(method.toLowerCase())) continue;

      const shaped = operation as OpenApiOperation;
      if (!shaped.responses) continue;
      if (Array.isArray(shaped.security) && shaped.security.length === 0) continue;

      shaped.responses["401"] ??= { description: "Missing or invalid credentials" };
    }
  }
}

/**
 * Builds the served OpenAPI document.
 *
 * The oRPC router describes every migrated procedure. Routes that stay on raw
 * Hono (Better Auth session, avatar downloads) cannot be described by the
 * router, so their operations are merged in explicitly from the Hono OpenAPI
 * registry rather than being silently dropped from the document.
 */
export async function buildApiDocument(rawPaths: OpenApiPaths) {
  const generated = await openApiGenerator.generate(router, {
    version: "3.1.0",
    base: {
      info: {
        title: "Tavi API",
        version: "1.0.0",
        description: "A multi-tenant app skeleton: authentication and workspaces.",
      },
      servers: [
        {
          url: normalizeApiServerUrl(env.TAVI_API_URL),
          description: "Tavi API server",
        },
      ],
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            description: "API key or session token (Bearer)",
          },
        },
      },
    },
  });

  const paths = {
    ...(generated.paths as OpenApiPaths | undefined),
    ...rawPaths,
  } satisfies OpenApiPaths;

  injectUnauthorizedResponses(paths);

  return { ...generated, paths };
}
