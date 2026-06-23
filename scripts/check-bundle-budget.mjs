#!/usr/bin/env node
/**
 * Client bundle-size budget — a deterministic performance gate.
 *
 * Astro's value is shipping little client JS; this script fails the build if
 * the compiled client bundles exceed their budgets, so a heavy dependency or
 * an accidental client-side import is caught at PR time instead of in prod.
 *
 * Budgets are a ratchet: set a little above the current size. When a change
 * legitimately needs more, raise the budget deliberately (and notice you did).
 *
 * Run after `astro build`:  node scripts/check-bundle-budget.mjs
 */
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ASTRO_DIR = path.join(process.cwd(), 'dist', 'client', '_astro');

// Per-logical-chunk budgets in bytes (filename content-hash stripped).
// reveal.js (PresentationMode) is isolated on its own line: it only loads on
// /posts/*/present routes, so it must not mask regressions in app-wide chunks.
const CHUNK_BUDGETS = {
  'PresentationMode.js': 1_250_000,
  'analytics.js': 235_000,
  'index.js': 95_000,
  'BuiltInAIBottomSheet.js': 48_000,
};
// Any chunk not listed above must stay under this ceiling — a new heavy chunk
// trips the gate and forces a deliberate budget entry.
const DEFAULT_CHUNK_BUDGET = 25_000;
// Aggregate ceiling for all client JS except the presentation bundle.
const APP_JS_BUDGET = 385_000;
// Aggregate ceiling for all client CSS.
const CSS_BUDGET = 130_000;

/** Strip Vite/Astro content hashes and the astro script suffix to a logical key. */
function logicalName(file) {
  return file
    .replace(/\.astro_astro_type_script_index_0_lang/, '')
    .replace(/\.[A-Za-z0-9_-]{8}\.(js|css)$/, '.$1');
}

function listFiles(dir, ext) {
  let entries;
  try {
    entries = readdirSync(dir, { recursive: true });
  } catch {
    console.error(`✗ ${dir} not found — run \`astro build\` first.`);
    process.exit(2);
  }
  return entries
    .filter((e) => typeof e === 'string' && e.endsWith(ext))
    .map((e) => ({ file: path.basename(e), size: statSync(path.join(dir, e)).size }));
}

const jsFiles = listFiles(ASTRO_DIR, '.js');
const cssFiles = listFiles(ASTRO_DIR, '.css');

// Sum sizes per logical chunk name.
const chunks = new Map();
for (const { file, size } of jsFiles) {
  const name = logicalName(file);
  chunks.set(name, (chunks.get(name) ?? 0) + size);
}

const failures = [];
const rows = [];

for (const [name, size] of [...chunks].sort((a, b) => b[1] - a[1])) {
  const budget = CHUNK_BUDGETS[name] ?? DEFAULT_CHUNK_BUDGET;
  const ok = size <= budget;
  if (!ok) failures.push(`chunk ${name}: ${size} B > budget ${budget} B`);
  rows.push({ name, size, budget, ok });
}

const appJs = [...chunks].filter(([n]) => n !== 'PresentationMode.js').reduce((s, [, v]) => s + v, 0);
const cssTotal = cssFiles.reduce((s, f) => s + f.size, 0);

if (appJs > APP_JS_BUDGET) failures.push(`app JS (excl. presentation): ${appJs} B > budget ${APP_JS_BUDGET} B`);
if (cssTotal > CSS_BUDGET) failures.push(`client CSS: ${cssTotal} B > budget ${CSS_BUDGET} B`);

const kb = (b) => (b / 1024).toFixed(1).padStart(8) + ' KB';
console.log('\nClient bundle budget\n' + '─'.repeat(54));
for (const r of rows) {
  console.log(`${r.ok ? '✓' : '✗'} ${kb(r.size)} / ${kb(r.budget)}  ${r.name}`);
}
console.log('─'.repeat(54));
console.log(`  app JS (excl. presentation): ${kb(appJs)} / ${kb(APP_JS_BUDGET)}`);
console.log(`  client CSS total:            ${kb(cssTotal)} / ${kb(CSS_BUDGET)}`);

if (failures.length) {
  console.error('\n✗ Bundle budget exceeded:\n  ' + failures.join('\n  '));
  console.error('\nRaise the budget in scripts/check-bundle-budget.mjs only if the increase is intended.');
  process.exit(1);
}
console.log('\n✓ All client bundles within budget.\n');
