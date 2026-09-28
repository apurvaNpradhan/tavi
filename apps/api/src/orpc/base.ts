import { ORPCError, os } from "@orpc/server";
import * as Sentry from "@sentry/node";
import { HTTPException } from "hono/http-exception";
import { type RequestIdentity, resolveRequestIdentity } from "../utils/authenticate-request";

/**
 * Values every oRPC procedure can read.
 *
 * `headers` is the initial context, provided by the transport (Hono) for each
 * request. Everything else is injected by middleware, so the handler never
 * touches the raw request.
 */
export type OrpcInitialContext = {
  headers: Headers;
};

/** Identity of the authenticated caller. */
export type AuthenticatedContext = RequestIdentity;

/**
 * Maps the HTTP statuses this API raises onto oRPC error codes.
 *
 * oRPC turns the code back into a status through `COMMON_ERROR_STATUS_MAP`, so
 * the REST response status is preserved across the migration. Kept as a switch
 * so the mapping is explicit and no unlisted status silently becomes a 4xx.
 */
function httpStatusToOrpcCode(status: number): string {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 405:
      return "METHOD_NOT_SUPPORTED";
    case 409:
      return "CONFLICT";
    case 412:
      return "PRECONDITION_FAILED";
    case 413:
      return "PAYLOAD_TOO_LARGE";
    case 422:
      return "UNPROCESSABLE_CONTENT";
    case 429:
      return "TOO_MANY_REQUESTS";
    case 501:
      return "NOT_IMPLEMENTED";
    case 502:
      return "BAD_GATEWAY";
    case 503:
      return "SERVICE_UNAVAILABLE";
    case 504:
      return "GATEWAY_TIMEOUT";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

/**
 * Converts an expected HTTP failure into the oRPC equivalent.
 *
 * The message is carried through because every `HTTPException` in this codebase
 * is written to be client-safe; unexpected errors are handled separately and
 * never expose their details.
 */
export function httpExceptionToOrpcError(error: HTTPException): ORPCError<string, unknown> {
  const code = httpStatusToOrpcCode(error.status);

  if (error.status >= 500) {
    Sentry.captureException(error);
  }

  return new ORPCError(code, { message: error.message || undefined, cause: error });
}

const base = os.$context<OrpcInitialContext>();

/**
 * Confines each call to its own Sentry scope.
 *
 * Without this, `Sentry.setUser` from one request could attribute another
 * request's events to the wrong user when calls overlap.
 */
const withSentryScope = base.middleware(async ({ next }) => {
  return Sentry.withIsolationScope(async () => {
    Sentry.setUser(null);
    try {
      return await next();
    } finally {
      Sentry.setUser(null);
    }
  });
});

/**
 * Translation and reporting boundary.
 *
 * Wraps authentication, authorization and the handler alike: domain code keeps
 * throwing `HTTPException`, and unexpected failures are reported to Sentry with
 * a generic message.
 */
const errorBoundary = base.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw httpExceptionToOrpcError(error);
    }
    if (error instanceof ORPCError) {
      // Validation and routing errors are already client-safe.
      throw error;
    }

    Sentry.captureException(error);
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Internal Server Error",
      cause: error,
    });
  }
});

/** A procedure that needs no credentials. */
export const publicProcedure = base.use(withSentryScope).use(errorBoundary);

/**
 * Resolves the caller for every authenticated procedure.
 *
 * Runs the same credential resolution as the Hono middleware, so an API key or
 * session works identically on `/api/*` and `/api/rpc`.
 */
const withAuthentication = publicProcedure.middleware(async ({ context, next }) => {
  const identity = await resolveRequestIdentity(context.headers);

  Sentry.setUser({ id: identity.userId });

  return next({ context: identity });
});

/** A procedure that requires a valid session or API key. */
export const authedProcedure = publicProcedure.use(withAuthentication);
