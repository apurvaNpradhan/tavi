#!/usr/bin/env node
/**
 * Verifies every locale in `i18n/` against the source of truth, `en-US`.
 *
 * Missing keys silently fall back to English at runtime, which is easy to ship
 * unnoticed. This makes the drift visible in CI instead.
 *
 * This compares locales with each other. It cannot see a key the code asks for
 * that no locale defines, or one nothing reads — `report.mjs` covers those.
 *
 * Usage:
 *   node scripts/i18n/check.mjs          # fail on drift
 *   node scripts/i18n/check.mjs --fix    # add missing files and keys from en-US
 */
import {
  compareNamespace,
  defaultLocale,
  flatten,
  namespaces,
  readNamespace,
  requireNamespace,
  setDeep,
  supportedLocales,
  writeNamespace,
} from "./shared.mjs";

const fix = process.argv.includes("--fix");

function reportExtra(locale, namespace, extra, log) {
  log(`   ${locale}/${namespace}: ${extra.length} key(s) not present in ${defaultLocale}:`);
  for (const key of extra.slice(0, 20)) log(`     - ${key}`);
}

let failed = false;
let fixedCount = 0;

for (const namespace of namespaces) {
  const source = requireNamespace(defaultLocale, namespace);
  const sourceStrings = flatten(source);

  if (sourceStrings.size === 0) {
    throw new Error(`English namespace is empty: ${namespace}`);
  }

  for (const locale of supportedLocales) {
    if (locale === defaultLocale) continue;
    const raw = readNamespace(locale, namespace);
    const { missing, extra, placeholderDrift } = compareNamespace(source, raw);

    if (missing.length === 0 && extra.length === 0 && placeholderDrift.length === 0) continue;

    if (fix && missing.length > 0) {
      for (const key of missing) {
        // Seed with the English value so the key exists and is translatable;
        // a real translation replaces it later.
        setDeep(raw, key, sourceStrings.get(key));
      }
      writeNamespace(locale, namespace, raw);
      fixedCount += missing.length;
      console.log(`🔧 ${locale}/${namespace}: added ${missing.length} missing key(s)`);
      if (extra.length > 0) reportExtra(locale, namespace, extra, console.warn);
      if (placeholderDrift.length === 0 && extra.length === 0) continue;
      // --fix can add missing keys, but cannot decide how to translate or delete others.
      if (placeholderDrift.length > 0) {
        console.error(
          `   ${locale}/${namespace}: placeholder drift in ${placeholderDrift.join(", ")}`,
        );
      }
      failed = true;
      continue;
    }

    failed = true;
    console.error(
      `❌ ${locale}/${namespace}: ${missing.length} missing, ${extra.length} extra, ${placeholderDrift.length} placeholder drift`,
    );
    for (const key of missing.slice(0, 20)) console.error(`   missing: ${key}`);
    for (const key of extra.slice(0, 20)) console.error(`   extra:   ${key}`);
    for (const key of placeholderDrift.slice(0, 20)) {
      console.error(`   placeholders: ${key}`);
    }
    if (missing.length > 20 || extra.length > 20) {
      console.error("   … more (output truncated)");
    }
  }
}

if (failed) {
  if (!fix) console.error("\nRun: pnpm i18n:check:fix for missing keys");
  process.exit(1);
}

if (fixedCount > 0) {
  console.log(`\n✅ Added ${fixedCount} key(s); locales now in sync`);
} else {
  console.log(`\n✅ ${supportedLocales.length} locale(s) in sync across ${namespaces.join(", ")}`);
}
