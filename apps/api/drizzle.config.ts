import { defineConfig } from "drizzle-kit";
import { resolveDatabaseConnectionString } from "./src/database/resolve-database-url";

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseConnectionString(),
  },
  casing: "snake_case",
});
