#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ASTRO_DIR = path.join(process.cwd(), 'dist', 'client', '_astro');

const CHUNK_BUDGETS = {
  'PresentationMode.js': 1_250_000,
  'analytics.js': 235_000,
  'index.js': 95_000,
  'BuiltInAIBottomSheet.js': 54_000,
  'build.js': 90_000,
};
const DEFAULT_CHUNK_BUDGET = 25_000;
const APP_JS_BUDGET = 385_000;
const CSS_BUDGET = 130_000;

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
