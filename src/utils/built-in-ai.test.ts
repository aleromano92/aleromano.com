import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BuiltInAIFeatures } from './built-in-ai';

function mockSelf(overrides: Record<string, unknown> = {}) {
  vi.stubGlobal('self', { ...overrides });
}

function mockNavigatorLanguage(lang: string) {
  vi.stubGlobal('navigator', { language: lang });
}

describe('detectFeatures', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns all false when neither Summarizer nor Translator is in self', async () => {
    mockNavigatorLanguage('fr-FR');
    mockSelf({}); // no Summarizer, no Translator

    const { detectFeatures } = await import('./built-in-ai');
    const result = await detectFeatures('en');

    expect(result).toEqual<BuiltInAIFeatures>({
      summarize: false,
      translate: false,
      targetLang: null,
      targetLangName: null,
    });
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Summarizer API not available'));
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Translator API not available'));
  });

  it('enables summarize when Summarizer.availability() returns "available"', async () => {
    mockNavigatorLanguage('en-US');
    const mockAvailability = vi.fn().mockResolvedValue('available');
    mockSelf({
      Summarizer: { availability: mockAvailability },
    });

    const { detectFeatures } = await import('./built-in-ai');
    const result = await detectFeatures('en');

    expect(result.summarize).toBe(true);
    expect(mockAvailability).toHaveBeenCalledWith({ outputLanguage: 'en' });
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Summarizer availability: "available"'));
  });

  it('enables summarize when Summarizer.availability() returns "downloading"', async () => {
    mockNavigatorLanguage('en-US');
    mockSelf({
      Summarizer: { availability: vi.fn().mockResolvedValue('downloading') },
    });

    const { detectFeatures } = await import('./built-in-ai');
    const result = await detectFeatures('en');

    expect(result.summarize).toBe(true);
  });

  it('disables summarize when Summarizer.availability() returns "unavailable"', async () => {
    mockNavigatorLanguage('en-US');
    mockSelf({
      Summarizer: { availability: vi.fn().mockResolvedValue('unavailable') },
    });

    const { detectFeatures } = await import('./built-in-ai');
    const result = await detectFeatures('en');

    expect(result.summarize).toBe(false);
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('disabled'));
  });

  it('disables summarize when availability check throws', async () => {
    mockNavigatorLanguage('en-US');
    mockSelf({
      Summarizer: { availability: vi.fn().mockRejectedValue(new Error('API error')) },
    });

    const { detectFeatures } = await import('./built-in-ai');
    const result = await detectFeatures('en');

    expect(result.summarize).toBe(false);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Summarizer availability check threw'),
      expect.any(Error)
    );
  });

  it('skips translate when browser language is English (native)', async () => {
    mockNavigatorLanguage('en-US');
    mockSelf({
      Summarizer: { availability: vi.fn().mockResolvedValue('available') },
      Translator: {},
    });

    const { detectFeatures } = await import('./built-in-ai');
    const result = await detectFeatures('en');

    expect(result.translate).toBe(false);
    expect(result.targetLang).toBeNull();
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('natively supported'));
  });

  it('skips translate when browser language is Italian (native)', async () => {
    mockNavigatorLanguage('it-IT');
    mockSelf({ Translator: {} });

    const { detectFeatures } = await import('./built-in-ai');
    const result = await detectFeatures('en');

    expect(result.translate).toBe(false);
    expect(result.targetLang).toBeNull();
  });

  it('enables translate for non-native browser language', async () => {
    mockNavigatorLanguage('fr-FR');
    mockSelf({ Translator: {} });

    const { detectFeatures } = await import('./built-in-ai');
    const result = await detectFeatures('en');

    expect(result.translate).toBe(true);
    expect(result.targetLang).toBe('fr-FR');
    expect(result.targetLangName).toBeTruthy();
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Translator enabled'));
  });
});

describe('summarize', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('throws when Summarizer is not in self', async () => {
    mockSelf({});

    const { summarize } = await import('./built-in-ai');

    await expect(summarize('text', 'tldr', 'en')).rejects.toThrow('Summarizer API not available');
  });

  it('returns the ReadableStream from summarizeStreaming', async () => {
    const fakeStream = new ReadableStream();
    const mockSummarizeStreaming = vi.fn().mockReturnValue(fakeStream);
    mockSelf({
      Summarizer: {
        create: vi.fn().mockResolvedValue({ summarizeStreaming: mockSummarizeStreaming }),
      },
    });

    const { summarize } = await import('./built-in-ai');
    const result = await summarize('some text', 'tldr', 'en');

    expect(result).toBe(fakeStream);
    expect(mockSummarizeStreaming).toHaveBeenCalledWith('some text');
  });

  it('creates summarizer with correct options for key-points', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      summarizeStreaming: vi.fn().mockReturnValue(new ReadableStream()),
    });
    mockSelf({ Summarizer: { create: mockCreate } });

    const { summarize } = await import('./built-in-ai');
    await summarize('text', 'key-points', 'en');

    expect(mockCreate).toHaveBeenCalledWith({ type: 'key-points', format: 'markdown', length: 'medium', outputLanguage: 'en' });
  });

  it('creates summarizer with correct options for tldr', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      summarizeStreaming: vi.fn().mockReturnValue(new ReadableStream()),
    });
    mockSelf({ Summarizer: { create: mockCreate } });

    const { summarize } = await import('./built-in-ai');
    await summarize('text', 'tldr', 'it');

    expect(mockCreate).toHaveBeenCalledWith({ type: 'tldr', format: 'plain-text', length: 'medium', outputLanguage: 'it' });
  });
});

describe('translate', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('throws when Translator is not in self', async () => {
    mockSelf({});

    const { translate } = await import('./built-in-ai');

    await expect(translate('text', 'en', 'fr')).rejects.toThrow('Translator API not available');
  });

  it('throws when language pair is unsupported', async () => {
    mockSelf({
      Translator: {
        availability: vi.fn().mockResolvedValue('unavailable'),
      },
    });

    const { translate } = await import('./built-in-ai');

    await expect(translate('text', 'en', 'kl')).rejects.toThrow('not supported on this device');
  });

  it('returns the ReadableStream from translateStreaming', async () => {
    const fakeStream = new ReadableStream();
    const mockTranslateStreaming = vi.fn().mockReturnValue(fakeStream);
    mockSelf({
      Translator: {
        availability: vi.fn().mockResolvedValue('available'),
        create: vi.fn().mockResolvedValue({ translateStreaming: mockTranslateStreaming }),
      },
    });

    const { translate } = await import('./built-in-ai');
    const result = await translate('Hello world', 'en', 'fr');

    expect(result).toBe(fakeStream);
    expect(mockTranslateStreaming).toHaveBeenCalledWith('Hello world');
  });
});
