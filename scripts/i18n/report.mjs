#!/usr/bin/env node
/**
 * Compares the locale files against the code that reads them.
 *
 * `check.mjs` compares locales *with each other* and cannot see either of the
 * two failures this reports:
 *
 *   - a key the code asks for that no locale defines, which i18next renders as
 *     the key itself, so the user reads `device.invalidCode`;
 *   - a key a locale defines that nothing reads, which is dead copy every
 *     future translator still has to work through.
 *
 * It also reports `t()` calls whose key cannot be resolved statically. Those are
 * unverifiable by construction: nothing here can prove the key exists, so they
 * are treated as failures rather than skipped.
 *
 * Usage:
 *   node scripts/i18n/report.mjs          # fail on missing, unbound, dynamic
 *   node scripts/i18n/report.mjs --fix    # also delete unused keys
 */
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import {
  collectSourceFiles,
  defaultLocale,
  flatten,
  namespaces,
  PLURAL_SUFFIXES,
  pruneNamespace,
  readNamespace,
  repoRoot,
  requireNamespace,
  supportedLocales,
  webSrcDir,
  writeNamespace,
} from "./shared.mjs";

const shouldFix = process.argv.includes("--fix");

// ---------------------------------------------------------------- reference --

/** `namespace -> Map(dotted key -> value)` for the source-of-truth locale. */
const reference = new Map(
  namespaces.map((namespace) => [namespace, flatten(requireNamespace(defaultLocale, namespace))]),
);

for (const [namespace, keys] of reference) {
  if (keys.size === 0) throw new Error(`English namespace is empty: ${namespace}`);
}

/** True when a namespace defines `key`, or a plural form of it. */
function isDefined(namespace, key) {
  if (reference.get(namespace).has(key)) return true;
  return PLURAL_SUFFIXES.some((suffix) => reference.get(namespace).has(`${key}${suffix}`));
}

// -------------------------------------------------------------------- usage --

/**
 * Keys the code reads, as `namespace\u0000key`.
 *
 * Nul is the separator because a locale key can contain anything a JSON string
 * can, including a colon or a dot.
 */
const used = new Set();
const missing = [];
const dynamic = [];

/** The namespace i18next falls back to, per `apps/web/src/shared/i18n/index.ts`. */
const DEFAULT_NAMESPACE = "common";

/** `t("key")`, plus an optional `{ ns: "..." }` option on the same call. */
const STATIC_CALL = /\b(?:[\w$]+\.)?t\(\s*(["'])([^"'\\]+)\1\s*(?:,\s*\{([^}]*)\})?/gu;
/** A `t()` whose first argument is not a plain string literal. */
const DYNAMIC_CALL = /\b(?:[\w$]+\.)?t\(\s*(?:`[^`]*`|[^"'`\s][^,\n)]*)/gu;
const NS_PREFIXED_LITERAL = /(["'])([a-z][\w-]*):([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+)\1/gu;
const STRING_LITERAL = /(["'])([^"'\\]+)\1/gu;
const JSX_KEY = /\bi18nKey\s*=\s*(["'])([^"'\\]+)\1/gu;
const NAMESPACE_OPTION = /\bns\s*:\s*(["'])([^"'\\]+)\1/u;

function claim(namespace, key, file) {
  // A plural call passes the base key; the locale defines the categories.
  used.add(`${namespace}\u0000${key}`);

  if (!isDefined(namespace, key)) {
    missing.push({ namespace, key, file: relative(repoRoot, file) });
  }
}

/**
 * Resolves one bare key against the namespaces a file declares.
 *
 * A file that translates under two namespaces (`useTranslation(["auth",
 * "common"])`) leaves a bare key genuinely ambiguous. Where exactly one declared
 * namespace defines it, that is the one; where several do, all of them count as
 * a use, because guessing would report the others as dead. Where none defines
 * it, the key is missing and is reported against the file's first namespace —
 * the one i18next would look in.
 */
function claimBare(key, declared, file) {
  // A `t()` with no `useTranslation` in the file still has a namespace: an i18n
  // instance carries the default one, and a `t` passed in as a parameter was
  // scoped by its caller. Resolving against every namespace is the useful
  // guess — normally exactly one defines the key — and a key nothing defines is
  // still reported, against the default namespace.
  const scope = declared.length > 0 ? declared : namespaces;
  const hits = scope.filter((namespace) => isDefined(namespace, key));

  if (hits.length === 0) {
    missing.push({
      namespace: declared[0] ?? DEFAULT_NAMESPACE,
      key,
      file: relative(repoRoot, file),
    });
    return;
  }

  for (const namespace of hits) used.add(`${namespace}\u0000${key}`);
}

function namespacesDeclaredIn(source) {
  const declared = new Set();

  for (const match of source.matchAll(/useTranslation\(\s*([^)]*)\)/gu)) {
    const quoted = [...match[1].matchAll(/["']([^"']+)["']/gu)].map((entry) => entry[1]);
    const known = quoted.filter((candidate) => namespaces.includes(candidate));

    // `useTranslation()` with no argument reads the default namespace, which is
    // `common` in `apps/web/src/shared/i18n/index.ts`.
    if (known.length === 0) declared.add("common");
    else for (const namespace of known) declared.add(namespace);
  }

  return [...declared];
}

function scanFile(file, source) {
  const declared = namespacesDeclaredIn(source);

  for (const match of source.matchAll(STATIC_CALL)) {
    const key = match[2];
    const option = match[3]?.match(NAMESPACE_OPTION)?.[2];

    // `t("common:appName")` names its namespace inline, which wins over both the
    // hook's argument and the options object.
    const inline = key.match(/^([a-z][\w-]*):(.+)$/u);
    if (inline && namespaces.includes(inline[1])) {
      claim(inline[1], inline[2], file);
      continue;
    }

    if (option && namespaces.includes(option)) {
      claim(option, key, file);
      continue;
    }

    claimBare(key, declared, file);
  }

  for (const match of source.matchAll(JSX_KEY)) claimBare(match[2], declared, file);

  for (const match of source.matchAll(NS_PREFIXED_LITERAL)) {
    // Catches keys held as plain strings rather than passed to `t()` directly
    // (a lookup table of messages, for instance). Restricted to a known
    // namespace plus a dotted path, so a storage key or a CSS variant is not
    // mistaken for a translation key.
    if (namespaces.includes(match[2])) claim(match[2], match[3], file);
  }

  for (const match of source.matchAll(DYNAMIC_CALL)) {
    // A ternary or a `??` between literals is still statically knowable, so each
    // literal inside the call is claimed as a key. Only a call with no literal
    // at all — a variable, or a template with an interpolation — cannot be
    // checked, and is reported rather than silently skipped.
    const literals = [...match[0].matchAll(STRING_LITERAL)].map((entry) => entry[2]);

    if (literals.length === 0) {
      dynamic.push(`${relative(repoRoot, file)}: ${match[0].trim()}`);
      continue;
    }

    for (const literal of literals) claimBare(literal, declared, file);
  }
}

for (const file of collectSourceFiles(webSrcDir)) {
  // Declaration files describe the shape of `t()` without calling it, and a
  // doc comment inside one reads like a call to a regex.
  if (file.endsWith(".d.ts")) continue;

  scanFile(file, readFileSync(file, "utf8"));
}

// ------------------------------------------------------------------- unused --

/** A reference key is live if it or a plural relative of it was read. */
function isUsed(namespace, key) {
  if (used.has(`${namespace}\u0000${key}`)) return true;

  const suffix = PLURAL_SUFFIXES.find((candidate) => key.endsWith(candidate));
  if (suffix && used.has(`${namespace}\u0000${key.slice(0, -suffix.length)}`)) return true;

  // The base key of a plural family counts as used when any form of it is read.
  for (const candidate of used) {
    const [candidateNamespace, candidateKey] = candidate.split("\u0000");
    if (candidateNamespace === namespace && candidateKey.startsWith(`${key}_`)) return true;
  }

  return false;
}

const unused = [];
for (const namespace of namespaces) {
  for (const key of reference.get(namespace).keys()) {
    if (!isUsed(namespace, key)) unused.push({ namespace, key });
  }
}

// ------------------------------------------------------------------- report --

const sortedMissing = missing.toSorted((a, b) =>
  `${a.namespace}:${a.key}`.localeCompare(`${b.namespace}:${b.key}`),
);

if (sortedMissing.length === 0 && unused.length === 0 && dynamic.length === 0) {
  console.log("i18n report is clean.");
} else {
  if (sortedMissing.length > 0) {
    console.error(`Missing keys (${sortedMissing.length}):`);
    for (const entry of sortedMissing) {
      console.error(`  - ${entry.namespace}:${entry.key}  (${entry.file})`);
    }
  }

  if (unused.length > 0) {
    console.log(`Unused keys (${unused.length}):`);
    for (const entry of unused) console.log(`  - ${entry.namespace}:${entry.key}`);
  }

  if (dynamic.length > 0) {
    console.error(`Dynamic keys, which cannot be verified (${dynamic.length}):`);
    for (const call of dynamic) console.error(`  - ${call}`);
  }
}

if (shouldFix) {
  if (dynamic.length > 0) {
    console.error("Refusing to prune translations while dynamic keys remain unresolved.");
    process.exit(1);
  }

  if (unused.length === 0) {
    console.log("No unused keys to remove.");
  } else {
    const dropped = new Set(unused.map((entry) => `${entry.namespace}\u0000${entry.key}`));

    for (const locale of supportedLocales) {
      for (const namespace of namespaces) {
        const pruned = pruneNamespace(
          readNamespace(locale, namespace),
          "",
          (path) => !dropped.has(`${namespace}\u0000${path}`),
        );

        writeNamespace(locale, namespace, pruned ?? {});
      }
    }

    console.log(
      `Removed ${unused.length} unused key(s) from ${supportedLocales.length} locale(s).`,
    );
  }
}

if (sortedMissing.length > 0 || dynamic.length > 0) {
  process.exit(1);
}
