import { describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";

const { app } = createApp();

/**
 * This template has no password sign-in, so the endpoints that could sign in
 * with, mint, or change a password must be absent from the surface — not merely
 * unlinked from the UI.
 *
 * The guard is an auth hook rather than the absence of `emailAndPassword`,
 * because Better Auth's email-OTP plugin registers its own password-reset pair
 * regardless of that option, and because a later change that re-enabled
 * `emailAndPassword` must not silently reopen the rest.
 */
describe("password auth", () => {
  const refusedPaths = [
    "/api/auth/sign-in/email",
    "/api/auth/sign-up/email",
    "/api/auth/change-password",
    "/api/auth/request-password-reset",
    "/api/auth/reset-password",
    "/api/auth/admin/set-user-password",
    "/api/auth/email-otp/request-password-reset",
    "/api/auth/email-otp/reset-password",
    "/api/auth/forget-password/email-otp",
  ];

  it.each(refusedPaths)("refuses %s", async (path) => {
    const response = await app.request(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "someone@example.com", password: "hunter2hunter2" }),
    });

    // The hook runs before body validation, so every one of these is refused
    // for the same reason rather than for its shape.
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      message: "Password sign-in is not available. Use a passwordless sign-in method.",
    });
  });

  it("leaves /api/auth/sign-in/username unregistered", async () => {
    // The username plugin is not installed, so this route is absent rather than
    // refused. It stays in the guard so that installing the plugin later cannot
    // reopen password sign-in by accident.
    const response = await app.request("/api/auth/sign-in/username", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "someone", password: "hunter2hunter2" }),
    });

    expect(response.status).toBe(404);
  });
});
