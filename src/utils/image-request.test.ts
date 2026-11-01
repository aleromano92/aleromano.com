import { describe, it, expect } from 'vitest';
import { isValidImageRequest } from './image-request';

const LOGO = '/_astro/nano-banana-personal-logo-light-no-background.Cr76We9a.png';

function params(query: Record<string, string>): URLSearchParams {
  return new URLSearchParams(query);
}

describe('isValidImageRequest', () => {
  it.each([
    ['the usual resize request', { href: LOGO, w: '80', h: '80', f: 'webp' }],
    ['a request with a quality preset', { href: '/_astro/alepro.DWikjuab.png', w: '300', h: '428', q: 'high', f: 'webp' }],
    ['a request without a format', { href: LOGO }],
    ['a jpeg source converted to avif', { href: '/_astro/cover.AbC-12_x.JPG', f: 'avif' }],
  ])('accepts %s', (_name, query) => {
    expect(isValidImageRequest(params(query))).toBe(true);
  });

  it.each(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'])('accepts the %s output format', (format) => {
    expect(isValidImageRequest(params({ href: LOGO, f: format }))).toBe(true);
  });

  it.each([
    ['a missing href', { f: 'webp' }],
    ['SQL in the format', { href: LOGO, f: 'webp) AND EXTRACTVALUE(2495,CONCAT(0x5c,0x716a706a71' }],
    ['an unknown format', { href: LOGO, f: 'bmp' }],
    ['a format in the wrong case', { href: LOGO, f: 'WEBP' }],
    ['SQL after the href', { href: `${LOGO}) AND 7873=CAST((CHR(113)` }],
    ['quotes after the href', { href: `${LOGO}".,,` }],
    ['path traversal', { href: '/../../../.env' }],
    ['traversal out of /_astro', { href: '/_astro/../.env.png' }],
    ['a path that only contains /_astro/', { href: '/static/_astro/image.png' }],
    ['a subdirectory of /_astro', { href: '/_astro/nested/image.png' }],
    ['a public-folder path', { href: '/images/photo.png' }],
    ['a remote URL', { href: 'https://evil.example/x.png' }],
    ['a non-image extension', { href: '/_astro/entry.Ab12.js' }],
  ])('rejects %s', (_name, query) => {
    expect(isValidImageRequest(params(query))).toBe(false);
  });
});
