// Chrome Built-in AI APIs — Summarizer and Translator
// Docs: https://developer.chrome.com/docs/ai/summarizer-api
//       https://developer.chrome.com/docs/ai/translator-api
//
// API access: global `Summarizer` and `Translator` objects (Chrome 138+)
// Feature detection: `'Summarizer' in self` / `'Translator' in self`

import { LANGUAGES } from '../types/i18n';

export type SummaryType = 'tldr' | 'key-points';

export interface BuiltInAIFeatures {
  summarize: boolean;
  translate: boolean;
  targetLang: string | null;
  targetLangName: string | null;
}

// Languages the site already supports natively — no translation offered
const NATIVE_LANGUAGES = Object.keys(LANGUAGES);

function getBrowserLangBase(): string {
  return (navigator.language || 'en').split('-')[0].toLowerCase();
}

export async function detectFeatures(postLanguage = 'en'): Promise<BuiltInAIFeatures> {
  let summarize = false;
  let translate = false;
  let targetLang: string | null = null;
  let targetLangName: string | null = null;

  // Check Summarizer API
  if (!('Summarizer' in self)) {
    console.info('[Built-in AI] Summarizer API not available — requires Chrome 138+ with Built-in AI enabled.');
  } else {
    try {
      const availability = await (self as any).Summarizer.availability({ outputLanguage: postLanguage });
      summarize = availability !== 'unavailable';
      console.info(`[Built-in AI] Summarizer availability: "${availability}" → ${summarize ? 'enabled' : 'disabled'}`);
      if (!summarize) {
        console.info('[Built-in AI] To enable the Summarizer, go to chrome://flags and enable "Summarization API for Gemini Nano", then restart Chrome and visit chrome://components to download "Optimization Guide On Device Model".');
      }
    } catch (err) {
      console.info('[Built-in AI] Summarizer availability check threw:', err);
    }
  }

  // Check Translator API
  const browserLang = getBrowserLangBase();
  const isNativeLang = NATIVE_LANGUAGES.includes(browserLang);

  if (isNativeLang) {
    console.info(`[Built-in AI] Translator skipped — browser language "${navigator.language}" is natively supported by the site.`);
  } else if (!('Translator' in self)) {
    console.info('[Built-in AI] Translator API not available — requires Chrome 138+ with Built-in AI enabled.');
  } else {
    try {
      translate = true;
      targetLang = navigator.language;
      targetLangName =
        new Intl.DisplayNames([navigator.language], { type: 'language' }).of(navigator.language) ?? navigator.language;
      console.info(`[Built-in AI] Translator enabled — target language: "${targetLang}" (${targetLangName})`);
    } catch (err) {
      console.info('[Built-in AI] Translator setup threw:', err);
      translate = false;
    }
  }

  return { summarize, translate, targetLang, targetLangName };
}

export async function summarize(text: string, type: SummaryType, outputLanguage: string): Promise<ReadableStream<string>> {
  if (!('Summarizer' in self)) throw new Error('Summarizer API not available');

  const summarizer = await (self as any).Summarizer.create({
    type,
    format: type === 'key-points' ? 'markdown' : 'plain-text',  // teaser → plain-text, key-points → markdown
    length: 'medium',
    outputLanguage,
  });

  return summarizer.summarizeStreaming(text);
}

export async function translate(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<ReadableStream<string>> {
  if (!('Translator' in self)) throw new Error('Translator API not available');

  const translationModelStatus = await (self as any).Translator.availability({
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
  });
  if (translationModelStatus === 'unavailable') {
    throw new Error(`Translation from ${sourceLang} to ${targetLang} is not supported on this device.`);
  }

  const translator = await (self as any).Translator.create({
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
  });

  return translator.translateStreaming(text);
}
