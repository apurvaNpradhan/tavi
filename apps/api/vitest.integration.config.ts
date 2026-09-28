import { defineConfig } from "vitest/config";

/**
 * Integration tests run against a real PostgreSQL database.
 *
 * They are deliberately serialized (`fileParallelism: false`): the suite
 * truncates shared tables between tests, so parallel files would trample each
 * other. Point `DATABASE_URL` at a throwaway database — never a real one.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["../../tests/api-integration/**/*.test.ts"],
    setupFiles: ["../../tests/api-integration/setup.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
});
