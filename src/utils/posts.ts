import type { CollectionEntry } from 'astro:content';
import { DEFAULT_LANGUAGE, type SupportedLanguage } from '../types/i18n';

export function getPostUrl(post: CollectionEntry<'blog'>): string {
    const [lang, ...slugParts] = post.slug.split('/');
    const postSlug = slugParts.join('/');
    
    // For English posts (default language), don't include language prefix
    if (lang === DEFAULT_LANGUAGE) {
        return `/posts/${postSlug}`;
    }
    
    // For other languages, include the language prefix
    return `/posts/${lang}/${postSlug}`;
}

export function parsePostSlug(slug: string | undefined): { lang: SupportedLanguage, cleanSlug: string } {
    if (!slug) {
        return { lang: DEFAULT_LANGUAGE, cleanSlug: '' };
    }

    // Remove language prefix if present
    const match = slug.match(/^(?:(en|it)\/)?(.+)$/);
    if (!match) {
        return { lang: DEFAULT_LANGUAGE, cleanSlug: slug };
    }

    const [, lang, cleanSlug] = match;
    return {
        lang: (lang || DEFAULT_LANGUAGE) as SupportedLanguage,
        cleanSlug
    };
}

export function findPostBySlug(
    posts: CollectionEntry<'blog'>[],
    slug: string | undefined,
    targetLang: SupportedLanguage
): CollectionEntry<'blog'> | undefined {
    const { cleanSlug } = parsePostSlug(slug);
    
    return posts.find((post) => {
        const [lang, ...slugParts] = post.slug.split('/');
        return lang === targetLang && slugParts.join('/') === cleanSlug;
    });
} 