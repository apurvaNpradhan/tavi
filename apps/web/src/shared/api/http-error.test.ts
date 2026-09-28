import { describe, expect, it } from "vitest";
import { HttpError, isUnauthorizedError, normalizeClientError } from "./http-error";

describe("HttpError", () => {
  it("carries the status code", () => {
    const error = new HttpError(404, "Note not found");
    expect(error.status).toBe(404);
    expect(error.message).toBe("Note not found");
    expect(error.name).toBe("HttpError");
  });

  it("is an Error subclass", () => {
    expect(new HttpError(500, "boom")).toBeInstanceOf(Error);
  });
});

describe("isUnauthorizedError", () => {
  it("is true only for 401", () => {
    expect(isUnauthorizedError(new HttpError(401, "nope"))).toBe(true);
    expect(isUnauthorizedError(new HttpError(403, "nope"))).toBe(false);
    expect(isUnauthorizedError(new Error("nope"))).toBe(false);
    expect(isUnauthorizedError(undefined)).toBe(false);
  });

  it("recognizes Better Auth status errors and oRPC unauthorized errors", () => {
    expect(isUnauthorizedError({ status: 401, statusText: "Unauthorized" })).toBe(true);
    expect(isUnauthorizedError({ code: "UNAUTHORIZED", message: "Unauthorized" })).toBe(true);
    expect(isUnauthorizedError({ cause: { status: 401 } })).toBe(true);
    expect(isUnauthorizedError({ status: 403 })).toBe(false);
  });
});

describe("normalizeClientError", () => {
  it("retains Better Auth's status for the query and mutation caches", () => {
    const error = normalizeClientError({ status: 401, statusText: "Session expired" }, "fallback");

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(401);
    expect(error.message).toBe("Session expired");
  });

  it("falls back to a normal Error for non-HTTP client failures", () => {
    expect(normalizeClientError({ message: "Bad request" }, "fallback")).toEqual(
      new Error("Bad request"),
    );
    expect(normalizeClientError(undefined, "fallback")).toEqual(new Error("fallback"));
  });
});
