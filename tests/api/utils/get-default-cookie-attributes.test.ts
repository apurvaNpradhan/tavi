import { describe, expect, it } from "vitest";
import { getDefaultCookieAttributes } from "../../../apps/api/src/utils/get-default-cookie-attributes";

/**
 * These guard the two ways session cookies break in practice: a cross-site
 * cookie without `SameSite=None; Secure`, and a first-party HTTPS cookie
 * without `Secure`.
 */
describe("getDefaultCookieAttributes", () => {
  it("uses strict attributes for a same-origin plain-HTTP setup", () => {
    const attributes = getDefaultCookieAttributes({
      apiUrl: "http://localhost:8080",
      clientUrl: "http://localhost:8080",
    });

    expect(attributes.sameSite).toBe("lax");
    // Secure cookies are not stored over http, so this must stay false.
    expect(attributes.secure).toBe(false);
  });

  it("requires SameSite=None and Secure when the origins differ", () => {
    const attributes = getDefaultCookieAttributes({
      apiUrl: "https://api.example.com",
      clientUrl: "https://app.example.com",
    });

    expect(attributes.sameSite).toBe("none");
    expect(attributes.secure).toBe(true);
  });

  it("sets Secure for a same-origin HTTPS setup", () => {
    const attributes = getDefaultCookieAttributes({
      apiUrl: "https://app.example.com",
      clientUrl: "https://app.example.com",
    });

    expect(attributes.sameSite).toBe("lax");
    expect(attributes.secure).toBe(true);
  });

  it("always sets httpOnly and a path", () => {
    const attributes = getDefaultCookieAttributes({
      apiUrl: "http://localhost:1337",
      clientUrl: "http://localhost:5173",
    });

    expect(attributes.httpOnly).toBe(true);
    expect(attributes.path).toBe("/");
  });

  it("applies an explicit cookie domain when given", () => {
    const attributes = getDefaultCookieAttributes({
      apiUrl: "https://app.example.com",
      clientUrl: "https://app.example.com",
      cookieDomain: ".example.com",
    });

    expect(attributes.domain).toBe(".example.com");
  });

  it("falls back safely when a URL is unparseable", () => {
    const attributes = getDefaultCookieAttributes({
      apiUrl: "not a url",
      clientUrl: "also not a url",
    });

    // Unknown origins must not be treated as cross-site.
    expect(attributes.sameSite).toBe("lax");
    expect(attributes.secure).toBe(false);
  });
});
