// Type-checks .ts and .astro files with TypeScript 7.1+ and the
// @astrojs/ts-content-mapper (registered in tsconfig.json). Replaces
// `astro check`, which can't run on TypeScript 7.
//
// Astro's own components in node_modules don't pass our strict config, so
// diagnostics from node_modules are dropped; everything else fails the check.
import { spawnSync } from 'node:child_process';

const run = (args) => spawnSync('npx', args, { encoding: 'utf8' });

// Generates .astro/types.d.ts (gitignored) so content collections are typed.
const sync = run(['astro', 'sync']);
if (sync.status !== 0) {
  process.stderr.write(sync.stdout + sync.stderr);
  process.exit(sync.status ?? 1);
}

const tsc = run(['tsc', '--noEmit', '--runExternalCode', '--pretty', 'false']);
const output = (tsc.stdout + tsc.stderr).trimEnd();

// A diagnostic starts at column 0; indented lines continue the previous one.
const diagnostics = output ? output.split(/\n(?=\S)/) : [];
const ours = diagnostics.filter((d) => !d.startsWith('node_modules/'));

if (ours.length > 0) {
  console.error(ours.join('\n'));
  console.error(`\n✗ ${ours.length} type error(s).`);
  process.exit(1);
}
if (tsc.status !== 0 && diagnostics.length === 0) {
  console.error(`✗ tsc exited with status ${tsc.status} and no diagnostics.`);
  process.exit(tsc.status ?? 1);
}
console.log(`✓ Type check passed (${diagnostics.length} diagnostic(s) ignored in node_modules).`);
