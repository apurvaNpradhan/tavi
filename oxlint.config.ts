import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    suspicious: "error",
  },
  plugins: [
    "eslint",
    "typescript",
    "unicorn",
    "oxc",
    "react",
    "jsx-a11y",
    "import",
    "vitest",
    "promise",
  ],
  jsPlugins: [
    { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
    { name: "tanstack-query", specifier: "@tanstack/eslint-plugin-query" },
  ],
  ignorePatterns: [
    "**/dist/**",
    "**/coverage/**",
    "**/.turbo/**",
    "**/node_modules/**",
    // Nested checkouts/scratch trees under `repos/` are not part of this
    // package; linting them would load their configs too.
    "repos/**",
    "**/routeTree.gen.ts",
    "**/uniwind-types.d.ts",
    "apps/api/drizzle/**",
    "tools/oxlint/anti-slop/**",
  ],
  rules: {
    "oxc/no-accumulating-spread": "error",
    "react/react-in-jsx-scope": "off",
    "import/no-named-as-default": "off",
    "import/no-named-as-default-member": "off",
    "import/no-unassigned-import": "off",
    "tanstack-query/exhaustive-deps": "error",
    "tanstack-query/stable-query-client": "error",
    "tanstack-query/no-rest-destructuring": "warn",
    "tanstack-query/no-unstable-deps": "error",
    "tanstack-query/infinite-query-property-order": "error",
    "tanstack-query/no-void-query-fn": "error",
    "tanstack-query/mutation-property-order": "error",
    "anti-slop/no-array-filter-map": "error",
    "anti-slop/no-reduce-accumulator-copy": "error",
    "anti-slop/no-chained-type-assertions": "error",
    "anti-slop/no-conditional-empty-object-spread": "error",
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-module-mocking": "error",
    "anti-slop/no-object-parameters": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    "anti-slop/no-unknown-returns": "error",
    "anti-slop/no-unknown-type-aliases": "error",
    "anti-slop/no-widen-then-assert": "error",
  },
  overrides: [
    {
      files: ["**/*.{test,spec}.{ts,tsx}", "tests/**/*.{ts,tsx}"],
      env: { vitest: true },
    },
  ],
});
