import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Read `apps/web/.env*` the same way the client does, so the proxy target and
  // the client's own `VITE_*` values come from one file.
  const env = loadEnv(mode, __dirname, "");

  return {
    plugins: [
      // Generates `src/routeTree.gen.ts` from the `src/routes` tree and splits
      // each route into its own chunk. Must run before the React plugin.
      tanstackRouter({
        autoCodeSplitting: true,
        // Keep co-located route tests out of the generated tree.
        routeFileIgnorePattern: "\\.test\\.tsx?$",
      }),
      tailwindcss(),
      react(),
    ],
    server: {
      host: true,
      // Port is per-worktree: `apps/web/.env.development.local` sets
      // VITE_DEV_PORT so concurrent worktrees do not collide. `strictPort`
      // fails loudly instead of drifting to another port, which would break
      // the API proxy and the session cookie's origin.
      port: Number(env.VITE_DEV_PORT) || 5173,
      strictPort: true,
      // Dev mirrors the bundled image: the browser only talks to this origin
      // and the dev server forwards `/api` to the API. That removes the CORS
      // configuration (and the opaque cross-origin failure when the API is
      // down) and keeps session cookies first-party.
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:1337",
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@i18n": path.resolve(__dirname, "../../i18n"),
      },
    },
    build: {
      target: "esnext",
      sourcemap: false,
    },
  };
});
