import type { SupportedLanguage } from '../types/i18n';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../types/i18n';

const USER_PREFERENCE_KEY = 'preferred-language';

export function getLanguageFromURL(pathname: string): SupportedLanguage {
  const [, lang] = pathname.split('/');
  if (lang in LANGUAGES && lang !== DEFAULT_LANGUAGE) return lang as SupportedLanguage;
  return DEFAULT_LANGUAGE;
}

function getLocalizedBlogPath(pathname: string, targetLang: SupportedLanguage): string {
  const [, , maybeLang, ...slugParts] = pathname.split('/');

  // Current path has a language prefix (e.g., /posts/it/my-post)
  if (maybeLang in LANGUAGES && maybeLang !== DEFAULT_LANGUAGE) {
    return targetLang === DEFAULT_LANGUAGE
      ? '/posts/' + slugParts.join('/')  // To English: remove language prefix
      : `/posts/${targetLang}/${slugParts.join('/')}`; // To other language: replace prefix
  }

  // Current path is in English (e.g., /posts/my-post)
  return targetLang === DEFAULT_LANGUAGE
    ? pathname  // Keep as is for English
    : `/posts/${targetLang}/${maybeLang}${slugParts.length ? '/' + slugParts.join('/') : ''}`; // Add language prefix
}

function getLocalizedPagePath(pathname: string, targetLang: SupportedLanguage): string {
  const [, currentLang, ...rest] = pathname.split('/');

  // Current path has a language prefix (e.g., /it/about)
  if (currentLang in LANGUAGES && currentLang !== DEFAULT_LANGUAGE) {
    return targetLang === DEFAULT_LANGUAGE
      ? '/' + rest.join('/')  // To English: remove language prefix
      : `/${targetLang}/${rest.join('/')}`; // To other language: replace prefix
  }

  // Current path is in English (e.g., /about)
  return targetLang === DEFAULT_LANGUAGE
    ? pathname  // Keep as is for English
    : `/${targetLang}${pathname}`; // Add language prefix
}

export function getLocalizedPathname(pathname: string, targetLang: SupportedLanguage): string {
  const parts = pathname.split('/');

  // Special handling for blog posts
  if (parts[1] === 'posts') {
    return getLocalizedBlogPath(pathname, targetLang);
  }

  // Regular pages
  return getLocalizedPagePath(pathname, targetLang);
}

export function detectLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const savedLang = localStorage.getItem(USER_PREFERENCE_KEY) as SupportedLanguage | null;
  if (savedLang && savedLang in LANGUAGES) return savedLang;

  const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
  return browserLang in LANGUAGES ? browserLang : DEFAULT_LANGUAGE;
}

export function setLanguagePreference(lang: SupportedLanguage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_PREFERENCE_KEY, lang);
}

export function getAlternateLinks(pathname: string): Array<{ href: string; hreflang: string }> {
  return Object.values(LANGUAGES).map(({ code, hreflang }) => ({
    href: new URL(getLocalizedPathname(pathname, code), 'https://aleromano.com').href,
    hreflang
  }));
} 