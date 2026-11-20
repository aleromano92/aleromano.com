import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SRC = import.meta.dirname;

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

function importSpecifiers(file: string): string[] {
  const content = readFileSync(file, 'utf8');
  const specifiers: string[] = [];
  const patterns = [
    /\bimport\s+[^'"]*?\bfrom\s+['"]([^'"]+)['"]/g,
    /\bexport\s+[^'"]*?\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
  ];
  for (const re of patterns) {
    for (const m of content.matchAll(re)) specifiers.push(m[1]);
  }
  return specifiers;
}

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
    const middleware = readFileSync(path.join(SRC, 'middleware.ts'), 'utf8');
    expect(middleware, 'middleware.ts must reference /admin routes').toMatch(/['"`]\/admin/);
  });

  it('sanity: the rule scanners actually see source files', () => {
    expect(sourceFiles('components').length).toBeGreaterThan(0);
    expect(sourceFiles('utils').length).toBeGreaterThan(0);
    expect(sourceFiles('pages/it', ['.astro']).length).toBeGreaterThan(0);
    expect(COMPONENT_PAGES).toContain('components');
  });
});
