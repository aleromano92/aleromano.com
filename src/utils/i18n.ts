import type { SupportedLanguage } from '../types/i18n';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../types/i18n';

export function getLanguageFromURL(pathname: string): SupportedLanguage {
  const [, lang] = pathname.split('/');
  if (lang in LANGUAGES && lang !== DEFAULT_LANGUAGE) return lang as SupportedLanguage;
  return DEFAULT_LANGUAGE;
}

export function getLocalizedPathname(pathname: string, lang: SupportedLanguage): string {
  const [, currentLang, ...rest] = pathname.split('/');
  
  // If current path has a language prefix
  if (currentLang in LANGUAGES && currentLang !== DEFAULT_LANGUAGE) {
    // For English (default language), remove the language prefix
    if (lang === DEFAULT_LANGUAGE) {
      return '/' + rest.join('/');
    }
    // For other languages, replace or add the language prefix
    return `/${lang}/${rest.join('/')}`;
  }
  
  // If current path doesn't have a language prefix (it's in English)
  if (lang === DEFAULT_LANGUAGE) {
    return pathname;
  }
  // Add language prefix for non-default languages
  return `/${lang}${pathname}`;
}

export function detectLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const savedLang = localStorage.getItem('preferred-language') as SupportedLanguage | null;
  if (savedLang && savedLang in LANGUAGES) return savedLang;

  const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
  return browserLang in LANGUAGES ? browserLang : DEFAULT_LANGUAGE;
}

export function setLanguagePreference(lang: SupportedLanguage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('preferred-language', lang);
}

export function getAlternateLinks(pathname: string): Array<{ href: string; hreflang: string }> {
  const alternates: Array<{ href: string; hreflang: string }> = [];
  
  Object.values(LANGUAGES).forEach(({ code, hreflang }) => {
    const href = new URL(getLocalizedPathname(pathname, code), 'https://aleromano.com').href;
    alternates.push({ href, hreflang });
  });
  
  return alternates;
} 