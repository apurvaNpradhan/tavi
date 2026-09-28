import { describe, expect, it } from "vitest";
import { loadNamespace } from "@i18n/resources";
import { createI18n } from ".";

/**
 * i18next asks a backend for one namespace at a time and stores the answer as
 * that namespace's bundle. These tests pin the handoff, because getting it
 * wrong does not throw — every lookup silently falls back to its own key and
 * the UI renders `onboarding.title`.
 */
describe("createI18n", () => {
  it("resolves a key from a named namespace", async () => {
    expect(await loadNamespace("en-US", "auth")).toHaveProperty("onboarding");
    const { instance, init } = createI18n();
    await init;
    await instance.loadNamespaces(["auth"]);

    expect(instance.t("onboarding.title", { ns: "auth" })).toBe("Create a workspace");
  });

  it("resolves a nested key from the default namespace", async () => {
    const { instance, init } = createI18n();
    await init;

    expect(instance.t("appName")).toBe("Tavi");
  });

  it("resolves a cross-namespace key", async () => {
    const { instance, init } = createI18n();
    await init;

    expect(instance.t("common:delete")).toBe("Delete");
  });

  it("loads feature namespaces lazily and interpolates values", async () => {
    const { instance, init } = createI18n();
    await init;

    expect(instance.hasResourceBundle("en-US", "workspace")).toBe(false);
    await instance.loadNamespaces(["workspace"]);
    await instance.loadNamespaces(["auth"]);

    expect(instance.t("onboarding.redirecting", { ns: "auth", name: "Acme" })).toBe(
      "Taking you to Acme…",
    );
  });
});
