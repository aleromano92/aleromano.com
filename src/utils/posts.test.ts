import { describe, it, expect } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import { getLocalizedPostUrl, parsePostSlug, findPostBySlug } from './posts';

// Minimal stand-in for a blog collection entry — only `id` is used by these helpers.
const post = (id: string) => ({ id }) as CollectionEntry<'blog'>;

describe('getLocalizedPostUrl', () => {
  it('omits the language prefix for the default language (en)', () => {
    expect(getLocalizedPostUrl(post('en/my-post'))).toBe('/posts/my-post');
  });

  it('includes the language prefix for non-default languages', () => {
    expect(getLocalizedPostUrl(post('it/my-post'))).toBe('/posts/it/my-post');
  });

  it('preserves nested slug segments', () => {
    expect(getLocalizedPostUrl(post('en/guides/intro'))).toBe('/posts/guides/intro');
    expect(getLocalizedPostUrl(post('it/guides/intro'))).toBe('/posts/it/guides/intro');
  });
});

describe('parsePostSlug', () => {
  it('returns default language and empty slug for undefined input', () => {
    expect(parsePostSlug(undefined)).toEqual({ lang: 'en', cleanSlug: '' });
  });

  it('extracts an explicit italian prefix', () => {
    expect(parsePostSlug('it/my-post')).toEqual({ lang: 'it', cleanSlug: 'my-post' });
  });

  it('extracts an explicit english prefix', () => {
    expect(parsePostSlug('en/my-post')).toEqual({ lang: 'en', cleanSlug: 'my-post' });
  });

  it('falls back to default language when there is no recognised prefix', () => {
    expect(parsePostSlug('my-post')).toEqual({ lang: 'en', cleanSlug: 'my-post' });
  });

  it('keeps nested segments in the clean slug', () => {
    expect(parsePostSlug('it/guides/intro')).toEqual({ lang: 'it', cleanSlug: 'guides/intro' });
  });
});

describe('findPostBySlug', () => {
  const posts = [post('en/hello'), post('it/hello'), post('en/guides/intro')];

  it('returns undefined when no slug is provided', () => {
    expect(findPostBySlug(posts, undefined, 'en')).toBeUndefined();
  });

  it('finds the post matching the target language', () => {
    expect(findPostBySlug(posts, 'hello', 'it')).toBe(posts[1]);
    expect(findPostBySlug(posts, 'hello', 'en')).toBe(posts[0]);
  });

  it('strips a leading language prefix from the slug before matching', () => {
    expect(findPostBySlug(posts, 'it/hello', 'en')).toBe(posts[0]);
  });

  it('matches nested slugs', () => {
    expect(findPostBySlug(posts, 'guides/intro', 'en')).toBe(posts[2]);
  });

  it('returns undefined when there is no match for the target language', () => {
    expect(findPostBySlug(posts, 'hello', 'en' as const)).toBe(posts[0]);
    expect(findPostBySlug(posts, 'missing', 'en')).toBeUndefined();
  });
});
