export const IMAGE_ENDPOINT_PATH = '/_image';

const OUTPUT_FORMATS = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);

const SOURCE_HREF_RE = /^\/_astro\/[\w.@-]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i;

export function isValidImageRequest(params: URLSearchParams): boolean {
  if (!SOURCE_HREF_RE.test(params.get('href') ?? '')) {
    return false;
  }

  const format = params.get('f');
  return format === null || OUTPUT_FORMATS.has(format);
}
