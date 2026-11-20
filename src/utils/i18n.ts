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

  if (maybeLang in LANGUAGES && maybeLang !== DEFAULT_LANGUAGE) {
    return targetLang === DEFAULT_LANGUAGE
      ? '/posts/' + slugParts.join('/')
      : `/posts/${targetLang}/${slugParts.join('/')}`;
  }

  return targetLang === DEFAULT_LANGUAGE
    ? pathname
    : `/posts/${targetLang}/${maybeLang}${slugParts.length ? '/' + slugParts.join('/') : ''}`;
}

function getLocalizedPagePath(pathname: string, targetLang: SupportedLanguage): string {
  const [, currentLang, ...rest] = pathname.split('/');

  if (currentLang in LANGUAGES && currentLang !== DEFAULT_LANGUAGE) {
    return targetLang === DEFAULT_LANGUAGE
      ? '/' + rest.join('/')
      : `/${targetLang}/${rest.join('/')}`;
  }

  return targetLang === DEFAULT_LANGUAGE
    ? pathname
    : `/${targetLang}${pathname}`;
}

export function getLocalizedPathname(pathname: string, targetLang: SupportedLanguage): string {
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'posts' && parts.length > 1 && parts[1] !== 'tags') {
    return getLocalizedBlogPath(pathname, targetLang);
  }

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