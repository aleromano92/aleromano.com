import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { CollectionEntry } from 'astro:content';
import { getLocalizedPostUrl, parsePostSlug } from './posts';

const post = (id: string) => ({ id }) as CollectionEntry<'blog'>;
const slugSegment = fc.stringMatching(/^[a-z0-9-]{1,20}$/);

describe('posts properties', () => {
  it('parsePostSlug always yields a supported language and a string slug, for any input', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.constantFrom(undefined)), (slug) => {
        const { lang, cleanSlug } = parsePostSlug(slug);
        return (lang === 'en' || lang === 'it') && typeof cleanSlug === 'string';
      })
    );
  });

  it('getLocalizedPostUrl always produces a /posts/ path; default lang has no prefix', () => {
    fc.assert(
      fc.property(fc.constantFrom('en', 'it'), slugSegment, (lang, slug) => {
        const url = getLocalizedPostUrl(post(`${lang}/${slug}`));
        const expected = lang === 'en' ? `/posts/${slug}` : `/posts/${lang}/${slug}`;
        return url === expected && url.startsWith('/posts/');
      })
    );
  });

  it('parsePostSlug round-trips an explicit lang prefix it produced', () => {
    fc.assert(
      fc.property(fc.constantFrom('en', 'it'), slugSegment, (lang, slug) => {
        const parsed = parsePostSlug(`${lang}/${slug}`);
        expect(parsed).toEqual({ lang, cleanSlug: slug });
      })
    );
  });
});
