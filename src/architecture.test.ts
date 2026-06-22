import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Architectural fitness functions.
 *
 * These tests turn the implicit conventions documented in CLAUDE.md into
 * mechanically-enforced gates: rules a human (or an agent) simply cannot
 * violate without the build going red. Each rule is verified to hold on the
 * current codebase; if a future change breaks the intended architecture, the
 * corresponding test fails and names the offending file.
 */

const SRC = import.meta.dirname;

/** All source files under `dir` (relative to src/) with one of the given extensions. */
function sourceFiles(dir: string, exts = ['.ts', '.astro']): string[] {
  const root = path.join(SRC, dir);
  let entries: string[];
  try {
    entries = readdirSync(root, { recursive: true }) as string[];
  } catch {
    return [];
  }
  return entries
    .filter((e) => exts.includes(path.extname(e)))
    .filter((e) => !e.endsWith('.test.ts') && !e.endsWith('.d.ts'))
    .map((e) => path.join(root, e));
}

/**
 * Raw module specifiers imported/exported-from/dynamically-imported by a file.
 * Regex-based (good enough for this ESM/Astro codebase): it handles multi-line,
 * `import type`, re-exports, dynamic and side-effect imports. Known blind spot:
 * a quote inside an inline comment within a multi-line import statement — not a
 * pattern that occurs here. Switch to a TS AST parser if that ever bites.
 */
function importSpecifiers(file: string): string[] {
  const content = readFileSync(file, 'utf8');
  const specifiers: string[] = [];
  const patterns = [
    /\bimport\s+[^'"]*?\bfrom\s+['"]([^'"]+)['"]/g, // import x from '...'
    /\bexport\s+[^'"]*?\bfrom\s+['"]([^'"]+)['"]/g, // export x from '...'
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // import('...')
    /\bimport\s+['"]([^'"]+)['"]/g, // import '...'
  ];
  for (const re of patterns) {
    for (const m of content.matchAll(re)) specifiers.push(m[1]);
  }
  return specifiers;
}

/** Absolute path a relative import resolves to (null for bare/package imports). */
function resolveLocal(fromFile: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  return path.resolve(path.dirname(fromFile), spec);
}

const PAGES = path.join(SRC, 'pages');
const COMPONENTS = path.join(SRC, 'components');
const COMPONENT_PAGES = path.join(COMPONENTS, 'pages');
const DATABASE = path.join(SRC, 'utils', 'database');

const isUnder = (target: string, dir: string) => target === dir || target.startsWith(dir + path.sep);

describe('architectural fitness functions', () => {
  it('R1: components must not import from pages (pages depend on components, not vice versa)', () => {
    const violations: string[] = [];
    for (const file of sourceFiles('components')) {
      for (const spec of importSpecifiers(file)) {
        const resolved = resolveLocal(file, spec);
        if (resolved && isUnder(resolved, PAGES)) {
          violations.push(`${path.relative(SRC, file)} imports '${spec}'`);
        }
      }
    }
    expect(violations, `Components must not depend on pages:\n${violations.join('\n')}`).toEqual([]);
  });

  it('R2: better-sqlite3 may only be imported inside src/utils/database', () => {
    const violations: string[] = [];
    for (const file of sourceFiles('.')) {
      if (isUnder(file, DATABASE)) continue;
      if (importSpecifiers(file).includes('better-sqlite3')) {
        violations.push(path.relative(SRC, file));
      }
    }
    expect(
      violations,
      `Raw DB driver must stay encapsulated in src/utils/database:\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('R3: every Italian page delegates to a components/pages/Base* shell', () => {
    const violations: string[] = [];
    for (const file of sourceFiles('pages/it', ['.astro'])) {
      const delegates = importSpecifiers(file).some((s) => /components\/pages\/Base/.test(s));
      if (!delegates) violations.push(path.relative(SRC, file));
    }
    expect(
      violations,
      `Italian pages must reuse a Base* page shell (no duplicated markup):\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('R4: utils must not import from components or pages (utils is a leaf layer)', () => {
    const violations: string[] = [];
    for (const file of sourceFiles('utils')) {
      for (const spec of importSpecifiers(file)) {
        const resolved = resolveLocal(file, spec);
        if (resolved && (isUnder(resolved, COMPONENTS) || isUnder(resolved, PAGES))) {
          violations.push(`${path.relative(SRC, file)} imports '${spec}'`);
        }
      }
    }
    expect(violations, `Utils must not depend on UI layers:\n${violations.join('\n')}`).toEqual([]);
  });

  it('R5: middleware still references the /admin prefix (structural canary)', () => {
    // Cheap canary that the admin guard has not been deleted wholesale. The
    // REAL authorization gate — that /admin actually denies/permits requests —
    // lives in middleware.test.ts as a behavioural test.
    const middleware = readFileSync(path.join(SRC, 'middleware.ts'), 'utf8');
    expect(middleware, 'middleware.ts must reference /admin routes').toMatch(/['"`]\/admin/);
  });

  // Guard against the rules silently testing nothing if a directory moves.
  it('sanity: the rule scanners actually see source files', () => {
    expect(sourceFiles('components').length).toBeGreaterThan(0);
    expect(sourceFiles('utils').length).toBeGreaterThan(0);
    expect(sourceFiles('pages/it', ['.astro']).length).toBeGreaterThan(0);
    expect(COMPONENT_PAGES).toContain('components');
  });
});
