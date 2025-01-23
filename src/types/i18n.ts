export type SupportedLanguage = 'en' | 'it';

export type TranslationKey = string;

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  flag: string;
  hreflang: string;
}

export const LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    hreflang: 'en-US'
  },
  it: {
    code: 'it',
    name: 'Italiano',
    flag: '🇮🇹',
    hreflang: 'it-IT'
  }
} as const;

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export interface LocalizedMeta {
  title: string;
  description: string;
}

export interface LocalizedContent<T = unknown> {
  en: T;
  it: T;
}

export type LocalizedSlug = {
  [key in SupportedLanguage]: string;
}; 