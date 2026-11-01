/**
 * Input check for Astro's on-demand image endpoint (`/_image`).
 *
 * Astro answers a bad output format, and some malformed source paths, with a
 * 500 instead of a 400. Vulnerability scanners stuffing SQL into the query
 * string then look like a server failure and trip the nginx 5xx alert.
 * Every image this site serves is a build asset under `/_astro/`, converted to
 * one of a handful of formats, so anything else is rejected up front.
 */

export const IMAGE_ENDPOINT_PATH = '/_image';

const OUTPUT_FORMATS = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);

// One file directly under /_astro/ with an image extension: no subdirectories,
// no traversal, no query or SQL fragments.
const SOURCE_HREF_RE = /^\/_astro\/[\w.@-]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i;

export function isValidImageRequest(params: URLSearchParams): boolean {
  if (!SOURCE_HREF_RE.test(params.get('href') ?? '')) {
    return false;
  }

  const format = params.get('f');
  return format === null || OUTPUT_FORMATS.has(format);
}
