import { describe, expect, it } from "vitest";
import { getTrustedAuthOrigins } from "./trusted-origins";

describe("getTrustedAuthOrigins", () => {
  it("allows the native callback and API origin in production without Expo Go origins", () => {
    const origins = getTrustedAuthOrigins({
      clientUrl: "https://app.example.com",
      apiUrl: "https://api.example.com/api",
      isProduction: true,
    });

    expect(origins).toEqual([
      "https://app.example.com",
      "tavi://",
      "tavi://*",
      "https://api.example.com",
    ]);
    expect(origins).not.toContain("exp://");
  });

  it("allows Expo Go origins only outside production", () => {
    const origins = getTrustedAuthOrigins({
      clientUrl: "http://localhost:5173",
      apiUrl: "http://localhost:1337/api",
      isProduction: false,
    });

    expect(origins).toContain("exp://");
    expect(origins).toContain("exp://**");
    expect(origins).toContain("exp://192.168.*.*:*/**");
    expect(origins).toContain("http://localhost:1337");
  });

  it("omits an invalid API URL without dropping the configured client origins", () => {
    expect(
      getTrustedAuthOrigins({
        clientUrl: "https://app.example.com",
        apiUrl: "not an absolute URL",
        isProduction: true,
      }),
    ).toEqual(["https://app.example.com", "tavi://", "tavi://*"]);
  });
});
