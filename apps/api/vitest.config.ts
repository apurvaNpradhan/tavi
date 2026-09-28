import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // `tests/api` holds cross-module unit tests; `src/**/*.test.ts` holds tests
    // colocated with a module that need its exact dependency resolution (pnpm's
    // isolated layout makes a bare specifier resolvable only from its package).
    include: ["../../tests/api/**/*.test.ts", "./src/**/*.test.ts"],
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
