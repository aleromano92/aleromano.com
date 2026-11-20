import { describe, expect, it } from 'vitest';
import { findComments, isLintedFile } from './find-comments.mjs';

const lines = (file, source) => findComments(file, source).map(({ line }) => line);

describe('isLintedFile', () => {
  it.each(['src/a.ts', 'scripts/b.mjs', 'src/c.astro', 'src/d.css', 'tsconfig.json', 'nginx/prod.conf', 'Dockerfile', '.github/workflows/x.yml', 'scripts/setup.sh'])(
    'lints %s',
    (file) => expect(isLintedFile(file)).toBe(true),
  );

  it.each(['src/content/blog/en/post.md', 'src/content/blog/en/demo.ts', 'public/x.js', '.agents/skills/teach/agents/openai.yaml', '.claude/skills/x/y.sh', 'package.json', 'README.md'])(
    'skips %s',
    (file) => expect(isLintedFile(file)).toBe(false),
  );
});

describe('findComments in scripts', () => {
  it('finds line and block comments with their line numbers', () => {
    const source = ['// one', 'const a = 1; /* two */', '/**', ' * three', ' */', 'const b = 2;'].join('\n');
    expect(findComments('x.ts', source)).toEqual([
      { line: 1, text: '// one' },
      { line: 2, text: '/* two */' },
      { line: 3, text: '/**\n * three\n */' },
    ]);
  });

  it('ignores comment-like text inside strings, templates and regexes', () => {
    const source = "const url = 'https://x.y';\nconst re = /\\/\\/*/g;\nconst t = `// ${url} /* no */`;";
    expect(findComments('x.ts', source)).toEqual([]);
  });

  it('exempts the hashbang and compiler directives', () => {
    const source = [
      '#!/usr/bin/env node',
      '/// <reference types="astro/client" />',
      '// @ts-expect-error testing invalid input',
      'const x = /* @__PURE__ */ make();',
      'await import(/* @vite-ignore */ path);',
      '// real comment',
    ].join('\n');
    expect(lines('x.mjs', source)).toEqual([6]);
  });
});

describe('findComments in .astro files', () => {
  const source = [
    '---',
    '// frontmatter',
    "const a = 'x';",
    '---',
    '<!-- markup -->',
    '<p>{/* expression */ a}</p>',
    '<script>',
    '  // client script',
    '</script>',
    '<style>',
    "  .a::before { content: '/* not a comment */'; }",
    '  /* style */',
    '</style>',
  ].join('\n');

  it('finds frontmatter, markup, expression, script and style comments', () => {
    expect(lines('x.astro', source)).toEqual([2, 5, 6, 8, 12]);
  });
});

describe('findComments in other languages', () => {
  it('finds CSS comments outside strings', () => {
    expect(lines('x.css', "/* a */\n.b { content: '/* no */'; }\n.c {} /* d */")).toEqual([1, 3]);
  });

  it('finds comments in JSONC tsconfig files', () => {
    expect(findComments('tsconfig.json', '{\n  // why\n  "extends": "x"\n}')).toEqual([{ line: 2, text: '// why' }]);
  });

  it('finds full-line hash comments, but not shebangs or trailing ones', () => {
    const source = '#!/bin/sh\n# one\necho "#nope" # trailing\n  # two';
    expect(lines('x.sh', source)).toEqual([2, 4]);
  });
});
