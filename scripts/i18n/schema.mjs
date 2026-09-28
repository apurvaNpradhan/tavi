#!/usr/bin/env node
/**
 * Regenerates `i18n/schema.json`, a machine-readable description of the keys
 * and their namespaces. Editors use it for autocomplete and it gives reviews a
 * compact diff when the translation surface changes.
 *
 * The same surface is typed for `t()` in `apps/web/src/types/i18next.d.ts`,
 * which reads the JSON directly. This file is the reviewable projection.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  defaultLocale,
  i18nDir,
  namespaces,
  requireNamespace,
  supportedLocales,
} from "./shared.mjs";

/** `{ key: "string" }` derived from one namespace file's shape. */
function describe(value, prefix = "") {
  const out = {};

  for (const [key, entry] of Object.entries(value)) {
    out[prefix ? `${prefix}.${key}` : key] =
      entry && typeof entry === "object" ? "namespace" : typeof entry;
  }

  return out;
}

const schema = {
  defaultLocale,
  supportedLocales,
  namespaces: Object.fromEntries(
    namespaces.map((namespace) => [
      namespace,
      describe(requireNamespace(defaultLocale, namespace)),
    ]),
  ),
};

writeFileSync(join(i18nDir, "schema.json"), `${JSON.stringify(schema, null, 2)}\n`);

console.log(`Wrote i18n/schema.json (${supportedLocales.length} locale(s))`);
