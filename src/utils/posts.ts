import type { CollectionEntry } from 'astro:content';
import { DEFAULT_LANGUAGE, type SupportedLanguage } from '../types/i18n';

export function getLocalizedPostUrl(post: CollectionEntry<'blog'>): string {
  const [lang, ...slugParts] = post.id.split('/');
  const postSlug = slugParts.join('/');

  if (lang === DEFAULT_LANGUAGE) {
    return `/posts/${postSlug}`;
  }

  return `/posts/${lang}/${postSlug}`;
}

export function parsePostSlug(slug: string | undefined): { lang: SupportedLanguage; cleanSlug: string } {
  if (!slug) {
    return { lang: DEFAULT_LANGUAGE, cleanSlug: '' };
  }

  const parts = slug.split('/');
  const possibleLang = parts[0] as SupportedLanguage;

  if (possibleLang === 'en' || possibleLang === 'it') {
    return {
      lang: possibleLang,
      cleanSlug: parts.slice(1).join('/'),
    };
  }

  return {
    lang: DEFAULT_LANGUAGE,
    cleanSlug: slug,
  };
}

export function findPostBySlug(
  posts: CollectionEntry<'blog'>[],
  slug: string | undefined,
  targetLang: SupportedLanguage
): CollectionEntry<'blog'> | undefined {
  if (!slug) return undefined;

  const cleanSlug = slug.replace(/^(en|it)\//, '');

  return posts.find((post) => {
    const [lang, ...slugParts] = post.id.split('/');
    return lang === targetLang && slugParts.join('/') === cleanSlug;
  });
}
