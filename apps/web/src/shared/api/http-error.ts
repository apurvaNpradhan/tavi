/** A non-2xx API response, carrying the status so callers can branch on it. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/** Preserve an HTTP status when a client library returns a result error. */
export function normalizeClientError(error: unknown, fallback: string): Error {
  if (error && typeof error === "object") {
    const candidate = error as { status?: unknown; message?: unknown; statusText?: unknown };
    const message =
      (typeof candidate.message === "string" && candidate.message) ||
      (typeof candidate.statusText === "string" && candidate.statusText) ||
      fallback;

    if (typeof candidate.status === "number") {
      return new HttpError(candidate.status, message);
    }
    return new Error(message);
  }

  return new Error(fallback);
}

export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof HttpError) return error.status === 401;

  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    status?: unknown;
    code?: unknown;
    cause?: unknown;
  };

  // Better Auth returns BetterFetchError instances with a numeric status,
  // while oRPC errors use the protocol code and may not expose a status.
  if (candidate.status === 401 || candidate.code === "UNAUTHORIZED") return true;

  return candidate.cause !== undefined && isUnauthorizedError(candidate.cause);
}

/**
 * Sends the browser to sign-in after a 401.
 *
 * Guarded so a burst of parallel queries failing together cannot queue up
 * multiple navigations, and so a 401 on the sign-in page itself does not loop.
 */
let redirecting = false;

export function handleUnauthorized(): void {
  if (redirecting || typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/auth/")) return;

  redirecting = true;
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/auth/login?redirect=${redirect}`);
}
