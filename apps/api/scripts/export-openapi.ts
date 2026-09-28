/**
 * Emits the OpenAPI document as JSON.
 *
 * It calls the running route (`/api/openapi`) rather than re-deriving the
 * document, so the committed artifact can never drift from what the server
 * actually serves — including the shared 401 responses injected at runtime.
 *
 * Usage: tsx scripts/export-openapi.ts [outputPath]   (defaults to stdout)
 */
import { writeFileSync } from "node:fs";
import { createApp } from "../src/index";

const { app } = createApp();

const response = await app.request("/api/openapi");

if (!response.ok) {
  console.error(`Failed to render the OpenAPI document: HTTP ${response.status}`);
  process.exit(1);
}

const document = await response.json();
const serialized = `${JSON.stringify(document, null, 2)}\n`;

const outputPath = process.argv[2];

if (outputPath) {
  writeFileSync(outputPath, serialized);
  console.log(`Wrote ${outputPath}`);
} else {
  process.stdout.write(serialized);
}
