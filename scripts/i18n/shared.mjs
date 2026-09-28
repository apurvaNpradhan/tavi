/**
 * Shared plumbing for the i18n scripts.
 *
 * The layout is `<repo>/i18n/<locale>/<namespace>.json` — one file per
 * namespace — with `i18n/resources.ts` as the registry that decides which
 * locales and namespaces exist. Keeping the file handling here is what lets
 * `check`, `report` and `schema` agree on what a key even is, instead of each
 * re-deriving it.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const i18nDir = join(repoRoot, "i18n");
export const webSrcDir = join(repoRoot, "apps", "web", "src");

// The registry is TypeScript, imported directly: Node strips the types on load,
// so there is no build step between the app and this tooling. That is the reason
// the list of locales and namespaces is not duplicated here.
export const { defaultLocale, namespaces, supportedLocales } = await import(
  new URL("../../i18n/resources.ts", import.meta.url).href
);

/** Keys that would reach the prototype chain if a locale file used them. */
export const FORBIDDEN_KEY = new Set(["__proto__", "constructor", "prototype"]);

/**
 * i18next plural categories, which a locale appends to a base key (`item_one`).
 *
 * A base key may therefore have no entry of its own while still being defined,
 * and a plural form may be present in one language but not the reference — which
 * is why both directions of the key comparison are plural-aware.
 */
export const PLURAL_SUFFIXES = ["_zero", "_one", "_two", "_few", "_many", "_other"];

export const namespacePath = (locale, namespace) => join(i18nDir, locale, `${namespace}.json`);

/**
 * Flattens a namespace object into `dotted.path -> value`.
 *
 * A Map rather than an object: locale keys can be any string, and a plain object
 * would make `__proto__` and `constructor` meaningful.
 */
export function flatten(value, prefix = "") {
  const out = new Map();

  for (const [key, entry] of Object.entries(value ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      for (const [nested, nestedValue] of flatten(entry, path)) {
        out.set(nested, nestedValue);
      }
    } else {
      out.set(path, entry);
    }
  }

  return out;
}

const PLACEHOLDER = /{{-?\s*([^},\s]+)(?:[^}]*)}}/g;

/** Named i18next interpolation placeholders in a translated value. */
export function placeholders(value) {
  return [...String(value).matchAll(PLACEHOLDER)].map((match) => match[1]).toSorted();
}

/** Compares keys and interpolation placeholders between two namespace objects. */
export function compareNamespace(source, translation) {
  const sourceStrings = flatten(source);
  const translationStrings = flatten(translation);

  const missing = [...sourceStrings.keys()].filter((key) => !translationStrings.has(key));
  const extra = [...translationStrings.keys()].filter((key) => !sourceStrings.has(key));
  const placeholderDrift = [...sourceStrings.keys()]
    .filter((key) => translationStrings.has(key))
    .filter(
      (key) =>
        JSON.stringify(placeholders(sourceStrings.get(key))) !==
        JSON.stringify(placeholders(translationStrings.get(key))),
    );

  return { missing, extra, placeholderDrift };
}

function parseNamespace(path) {
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("namespace must contain a JSON object");
    }
    return value;
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}`, { cause: error });
  }
}

/** Reads a namespace, treating a missing file as an empty namespace. */
export function readNamespace(locale, namespace) {
  const path = namespacePath(locale, namespace);
  return existsSync(path) ? parseNamespace(path) : {};
}

/** Reads a namespace that has to exist: the reference locale's. */
export function requireNamespace(locale, namespace) {
  const path = namespacePath(locale, namespace);
  if (!existsSync(path)) throw new Error(`Missing locale file ${path}`);
  return parseNamespace(path);
}

/**
 * Writes a namespace file, creating the locale directory if needed.
 *
 * Two-space indentation and a trailing newline match what the formatter would
 * produce, so a generated file is not immediately rewritten by `pnpm format`.
 */
export function writeNamespace(locale, namespace, value) {
  mkdirSync(join(i18nDir, locale), { recursive: true });
  writeFileSync(namespacePath(locale, namespace), `${JSON.stringify(value, null, 2)}\n`);
}

export function setDeep(target, path, value) {
  const parts = path.split(".");
  // `__proto__` in a locale file would otherwise reach the prototype chain.
  if (parts.some((part) => FORBIDDEN_KEY.has(part))) return target;

  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    cursor[part] ??= {};
    cursor = cursor[part];
  }
  cursor[parts.at(-1)] = value;

  return target;
}

/**
 * A copy of a namespace object with every leaf `isAllowed` rejects removed.
 *
 * Objects that become empty are dropped with their last key, so pruning does not
 * leave `"device": {}` behind. `prefix` is the dotted path within the namespace.
 */
export function pruneNamespace(value, prefix, isAllowed) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return isAllowed(prefix) ? value : undefined;
  }

  const next = {};

  for (const [key, entry] of Object.entries(value)) {
    const pruned = pruneNamespace(entry, prefix ? `${prefix}.${key}` : key, isAllowed);
    if (pruned !== undefined) next[key] = pruned;
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

/** Recursively collects the `.ts`/`.tsx` files under a directory. */
export function collectSourceFiles(directory) {
  const out = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);

    if (entry.isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }

  return out;
}
