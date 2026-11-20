import { spawnSync } from 'node:child_process';

const run = (args) => spawnSync('npx', args, { encoding: 'utf8' });

const sync = run(['astro', 'sync']);
if (sync.status !== 0) {
  process.stderr.write(sync.stdout + sync.stderr);
  process.exit(sync.status ?? 1);
}

const tsc = run(['tsc', '--noEmit', '--runExternalCode', '--pretty', 'false']);
const output = (tsc.stdout + tsc.stderr).trimEnd();

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
