import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findComments, isLintedFile } from './lint-comments/find-comments.mjs';
import { compareToBaseline, toBaseline } from './lint-comments/ratchet.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASELINE_PATH = fileURLToPath(new URL('./lint-comments/baseline.json', import.meta.url));
const UPDATE_COMMAND = 'npm run lint:comments -- --update';
const COMMENT_MARKERS = /^\s*(?:\/\*+|\/\/+|<!--|#|\*(?!\/))|(?:\*\/|-->)\s*$/gm;

function lintedFiles(scopes = []) {
  const args = ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', ...scopes];
  const output = execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return [...new Set(output.split('\0'))]
    .filter((file) => file && isLintedFile(file) && existsSync(join(ROOT, file)))
    .sort();
}

function commentsByFile(files) {
  return Object.fromEntries(files.map((file) => [file, findComments(file, readFileSync(join(ROOT, file), 'utf8'))]));
}

function countsOf(commentMap) {
  return Object.fromEntries(Object.entries(commentMap).map(([file, comments]) => [file, comments.length]));
}

function total(counts) {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

function readBaseline() {
  return existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : null;
}

function preview(text) {
  const flat = text.replace(COMMENT_MARKERS, ' ').replace(/\s+/g, ' ').trim();
  return flat.length > 110 ? `${flat.slice(0, 107)}...` : flat;
}

function printComments(file, comments, print = console.log) {
  for (const { line, text } of comments) print(`${file}:${line}  ${preview(text)}`);
}

function reportIncreases(increased, commentMap) {
  console.error('✗ Code comments are banned (docs/adr/0003-no-code-comments.md): the ratchet only lets counts go down.');
  for (const { file, allowed, actual } of increased) {
    console.error(`\n${file}: ${actual} comment(s), baseline allows ${allowed}`);
    printComments(file, commentMap[file], console.error);
  }
  console.error('\nSay it in code instead (names, types, tests), record decisions in docs/adr/, and file an issue for any workaround.');
}

function reportTightened(tightened) {
  console.error('✗ Comments were removed but the baseline still allows them. Lock in the progress:');
  for (const { file, allowed, actual } of tightened) console.error(`  ${file}: ${allowed} → ${actual}`);
  console.error(`Run \`${UPDATE_COMMAND}\` and commit scripts/lint-comments/baseline.json.`);
}

function check() {
  const commentMap = commentsByFile(lintedFiles());
  const counts = countsOf(commentMap);
  const { increased, tightened } = compareToBaseline(readBaseline() ?? {}, counts);
  if (increased.length > 0) reportIncreases(increased, commentMap);
  if (tightened.length > 0) reportTightened(tightened);
  if (increased.length > 0 || tightened.length > 0) return 1;
  console.log(`✓ Comment ratchet holds: ${total(counts)} legacy comment(s) left in the baseline.`);
  return 0;
}

function update() {
  const commentMap = commentsByFile(lintedFiles());
  const counts = countsOf(commentMap);
  const baseline = readBaseline();
  const { increased } = compareToBaseline(baseline ?? counts, counts);
  if (increased.length > 0) {
    reportIncreases(increased, commentMap);
    return 1;
  }
  const next = toBaseline(counts);
  writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`✓ Baseline updated: ${total(next)} comment(s) in ${Object.keys(next).length} file(s).`);
  return 0;
}

function list(scopes) {
  const commentMap = commentsByFile(lintedFiles(scopes));
  for (const [file, comments] of Object.entries(commentMap)) printComments(file, comments);
  const counts = countsOf(commentMap);
  const files = Object.values(counts).filter((count) => count > 0).length;
  console.log(`\n${total(counts)} comment(s) in ${files} file(s).`);
  return 0;
}

const [mode, ...scopes] = process.argv.slice(2);
const MODES = { '--list': () => list(scopes), '--update': update };
process.exitCode = (MODES[mode] ?? check)();
