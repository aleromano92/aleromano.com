import { parseSync } from 'rolldown/utils';
import { parse as parseAstro } from '@astrojs/compiler-rs';

const EXCLUDED_PATHS = [/^src\/content\//, /^public\//, /^\.agents\//, /^\.claude\/skills\//];

const DIRECTIVES = [
  /^\/\s*<reference\s/,
  /^\s*@ts-(?:expect-error|ignore|nocheck|check)\b/,
  /^\s*@vite-ignore\b/,
  /^\s*[#@]__PURE__\b/,
];

const LANGUAGES = [
  { name: 'astro', pattern: /\.astro$/ },
  { name: 'css', pattern: /\.css$/ },
  { name: 'script', pattern: /\.[cm]?[jt]s$/ },
  { name: 'jsonc', pattern: /(?:^|\/)tsconfig[^/]*\.json$|\.jsonc$/ },
  { name: 'hash', pattern: /\.(?:sh|ya?ml|conf|toml)$|(?:^|\/)Dockerfile[^/]*$/ },
];

const CSS_TOKENS = /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\/\*[\s\S]*?\*\//g;

function languageOf(file) {
  if (EXCLUDED_PATHS.some((pattern) => pattern.test(file))) return null;
  return LANGUAGES.find(({ pattern }) => pattern.test(file))?.name ?? null;
}

export function isLintedFile(file) {
  return languageOf(file) !== null;
}

function isDirective(commentBody) {
  return DIRECTIVES.some((pattern) => pattern.test(commentBody));
}

function scriptSpans(file, source) {
  const { program, comments } = parseSync(file, source);
  return comments
    .filter((comment) => comment.start !== program.hashbang?.start && !isDirective(comment.value))
    .map(({ start, end }) => ({ start, end }));
}

function jsoncSpans(file, source) {
  return scriptSpans(`${file}.js`, `(${source}\n)`).map(({ start, end }) => ({ start: start - 1, end: end - 1 }));
}

function cssSpans(css, offset = 0) {
  return [...css.matchAll(CSS_TOKENS)]
    .filter((match) => match[0].startsWith('/*'))
    .map((match) => ({ start: offset + match.index, end: offset + match.index + match[0].length }));
}

function hashSpans(source) {
  const spans = [];
  let offset = 0;
  for (const [index, line] of source.split('\n').entries()) {
    const isShebang = index === 0 && line.startsWith('#!');
    if (!isShebang && /^\s*#/.test(line)) spans.push({ start: offset + line.indexOf('#'), end: offset + line.length });
    offset += line.length + 1;
  }
  return spans;
}

function isStyleElement(node) {
  return node.type === 'JSXElement' && node.openingElement?.name?.name === 'style';
}

function visitAstroNode(node, spans) {
  if (node.type === 'AstroComment') spans.push({ start: node.start, end: node.end });
  if (!isStyleElement(node)) return;
  for (const child of node.children) {
    if (child.type === 'JSXText') spans.push(...cssSpans(child.value, child.start));
  }
}

function walk(node, visit) {
  if (Array.isArray(node)) return node.forEach((child) => walk(child, visit));
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') walk(value, visit);
  }
}

function astroSpans(source) {
  const { ast } = parseAstro(source);
  const spans = ast.comments
    .filter((comment) => !isDirective(comment.value))
    .map(({ start, end }) => ({ start, end }));
  walk(ast.body, (node) => visitAstroNode(node, spans));
  return spans;
}

const SPAN_FINDERS = {
  astro: (_file, source) => astroSpans(source),
  css: (_file, source) => cssSpans(source),
  script: scriptSpans,
  jsonc: jsoncSpans,
  hash: (_file, source) => hashSpans(source),
};

function lineNumberAt(lineStarts, offset) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (lineStarts[middle] <= offset) low = middle;
    else high = middle - 1;
  }
  return low + 1;
}

function lineStartsOf(source) {
  const starts = [0];
  for (let index = source.indexOf('\n'); index !== -1; index = source.indexOf('\n', index + 1)) starts.push(index + 1);
  return starts;
}

export function findCommentSpans(file, source) {
  const language = languageOf(file);
  if (!language) return [];
  return SPAN_FINDERS[language](file, source).sort((a, b) => a.start - b.start);
}

export function findComments(file, source) {
  const lineStarts = lineStartsOf(source);
  return findCommentSpans(file, source).map(({ start, end }) => ({
    line: lineNumberAt(lineStarts, start),
    text: source.slice(start, end),
  }));
}
