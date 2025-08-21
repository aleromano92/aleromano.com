import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getLanguageFromURL, getLocalizedPathname, detectLanguage, setLanguagePreference, getAlternateLinks } from './i18n';

describe('getLanguageFromURL', () => {
  it('should return "it" for Italian paths', () => {
    expect(getLanguageFromURL('/it/blog')).toBe('it');
    expect(getLanguageFromURL('/it/about')).toBe('it');
    expect(getLanguageFromURL('/it/posts/my-post')).toBe('it');
  });

  it('should return "en" for English paths', () => {
    expect(getLanguageFromURL('/blog')).toBe('en');
    expect(getLanguageFromURL('/about')).toBe('en');
    expect(getLanguageFromURL('/posts/my-post')).toBe('en');
  });

  it('should return "en" for invalid language codes', () => {
    expect(getLanguageFromURL('/fr/blog')).toBe('en');
    expect(getLanguageFromURL('/es/about')).toBe('en');
  });
});

describe('getLocalizedPathname', () => {
  describe('regular pages', () => {
    it('should handle paths without language prefix', () => {
      expect(getLocalizedPathname('/blog', 'it')).toBe('/it/blog');
      expect(getLocalizedPathname('/about', 'it')).toBe('/it/about');
    });

    it('should handle paths with language prefix', () => {
      expect(getLocalizedPathname('/it/blog', 'en')).toBe('/blog');
      expect(getLocalizedPathname('/it/about', 'en')).toBe('/about');
    });

    it('should handle nested paths', () => {
      expect(getLocalizedPathname('/projects/web', 'it')).toBe('/it/projects/web');
      expect(getLocalizedPathname('/it/projects/web', 'en')).toBe('/projects/web');
    });
  });

  describe('blog posts', () => {
    it('should handle blog posts without language prefix', () => {
      expect(getLocalizedPathname('/posts/my-post', 'it')).toBe('/posts/it/my-post');
      expect(getLocalizedPathname('/posts/azure-post', 'it')).toBe('/posts/it/azure-post');
    });

    it('should handle blog posts with language prefix', () => {
      expect(getLocalizedPathname('/posts/it/my-post', 'en')).toBe('/posts/my-post');
      expect(getLocalizedPathname('/posts/it/azure-post', 'en')).toBe('/posts/azure-post');
    });

    it('should handle blog posts with multiple path segments', () => {
      expect(getLocalizedPathname('/posts/tech/azure/my-post', 'it')).toBe('/posts/it/tech/azure/my-post');
      expect(getLocalizedPathname('/posts/it/tech/azure/my-post', 'en')).toBe('/posts/tech/azure/my-post');
    });
  });

  describe('posts metadata pages (tags, etc.)', () => {
    it('should treat /posts/tags/ as regular page, not blog post', () => {
      expect(getLocalizedPathname('/posts/tags/', 'it')).toBe('/it/posts/tags/');
      expect(getLocalizedPathname('/posts/tags', 'it')).toBe('/it/posts/tags');
    });

    it('should handle /posts/tags/ with existing language prefix', () => {
      expect(getLocalizedPathname('/it/posts/tags/', 'en')).toBe('/posts/tags/');
      expect(getLocalizedPathname('/it/posts/tags', 'en')).toBe('/posts/tags');
    });

    it('should handle nested tags paths', () => {
      expect(getLocalizedPathname('/posts/tags/javascript', 'it')).toBe('/it/posts/tags/javascript');
      expect(getLocalizedPathname('/it/posts/tags/javascript', 'en')).toBe('/posts/tags/javascript');
    });

    it('should handle edge cases with trailing slashes', () => {
      expect(getLocalizedPathname('/posts/tags/', 'it')).toBe('/it/posts/tags/');
      expect(getLocalizedPathname('/posts/tags', 'it')).toBe('/it/posts/tags');
      expect(getLocalizedPathname('/it/posts/tags/', 'en')).toBe('/posts/tags/');
      expect(getLocalizedPathname('/it/posts/tags', 'en')).toBe('/posts/tags');
    });

    it('should properly distinguish between blog posts and tags paths', () => {
      // These should be treated as blog posts (language goes after /posts/)
      expect(getLocalizedPathname('/posts/my-blog-post', 'it')).toBe('/posts/it/my-blog-post');
      expect(getLocalizedPathname('/posts/another-post', 'it')).toBe('/posts/it/another-post');
      
      // These should be treated as regular pages (language goes at the beginning)
      expect(getLocalizedPathname('/posts/tags/react', 'it')).toBe('/it/posts/tags/react');
      expect(getLocalizedPathname('/posts/tags/javascript', 'it')).toBe('/it/posts/tags/javascript');
    });

    it('should handle language switching on tags pages correctly', () => {
      // English tags page to Italian
      expect(getLocalizedPathname('/posts/tags/', 'it')).toBe('/it/posts/tags/');
      expect(getLocalizedPathname('/posts/tags/react', 'it')).toBe('/it/posts/tags/react');
      
      // Italian tags page to English  
      expect(getLocalizedPathname('/it/posts/tags/', 'en')).toBe('/posts/tags/');
      expect(getLocalizedPathname('/it/posts/tags/react', 'en')).toBe('/posts/tags/react');
    });

    it('should NOT generate /posts/it/tags/ for tags pages (regression test)', () => {
      // This was the bug: generating /posts/it/tags/ instead of /it/posts/tags/
      expect(getLocalizedPathname('/posts/tags/', 'it')).not.toBe('/posts/it/tags/');
      expect(getLocalizedPathname('/posts/tags', 'it')).not.toBe('/posts/it/tags');
      
      // Should generate correct paths
      expect(getLocalizedPathname('/posts/tags/', 'it')).toBe('/it/posts/tags/');
      expect(getLocalizedPathname('/posts/tags', 'it')).toBe('/it/posts/tags');
    });

    it('should handle same language switching (no-op)', () => {
      // English to English
      expect(getLocalizedPathname('/posts/tags/', 'en')).toBe('/posts/tags/');
      expect(getLocalizedPathname('/posts/tags/react', 'en')).toBe('/posts/tags/react');
      
      // Italian to Italian  
      expect(getLocalizedPathname('/it/posts/tags/', 'it')).toBe('/it/posts/tags/');
      expect(getLocalizedPathname('/it/posts/tags/react', 'it')).toBe('/it/posts/tags/react');
    });
  });
});

describe('detectLanguage', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    // Mock window and localStorage
    mockStorage = {} as Storage;

    // Mock window with localStorage
    const windowMock: Pick<Window, 'localStorage'> = {
      localStorage: mockStorage
    };

    // Mock navigator with Object.defineProperty to handle read-only property
    const navigatorMock = { language: 'en-US' };
    Object.defineProperty(navigatorMock, 'language', {
      writable: true,
      value: 'en-US'
    });

    vi.stubGlobal('window', windowMock);
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('navigator', navigatorMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return language from localStorage if available', () => {
    mockStorage.getItem = () => 'it';

    expect(detectLanguage()).toBe('it');
  });

  it('should return browser language if no localStorage value', () => {
    mockStorage.getItem = () => null;

    expect(detectLanguage()).toBe('en');
  });

  it('should return default language if browser language not supported', () => {
    mockStorage.getItem = () => null;
    Object.defineProperty(navigator, 'language', {
      writable: true,
      value: 'fr-FR'
    });

    expect(detectLanguage()).toBe('en');
  });

  it('should return default language if running server-side', () => {
    vi.stubGlobal('window', undefined);
    
    expect(detectLanguage()).toBe('en');
  });
});

describe('setLanguagePreference', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    // Mock window and localStorage
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      key: vi.fn(),
      length: 0
    } as Storage;

    // Mock window with localStorage
    const windowMock: Pick<Window, 'localStorage'> = {
      localStorage: mockStorage
    };

    vi.stubGlobal('window', windowMock);
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should save language preference to localStorage', () => {
    setLanguagePreference('it');

    expect(mockStorage.setItem).toHaveBeenCalledWith('preferred-language', 'it');
  });

  it('should not throw when running server-side', () => {
    vi.stubGlobal('window', undefined);

    expect(() => setLanguagePreference('it')).not.toThrow();
  });
});

describe('getAlternateLinks', () => {
  it('should return alternate links for all supported languages', () => {
    const links = getAlternateLinks('/blog');

    expect(links).toHaveLength(2);
    expect(links).toContainEqual({
      href: 'https://aleromano.com/blog',
      hreflang: 'en-US'
    });
    expect(links).toContainEqual({
      href: 'https://aleromano.com/it/blog',
      hreflang: 'it-IT'
    });
  });

  it('should handle blog post paths correctly', () => {
    const links = getAlternateLinks('/posts/my-post');
    
    expect(links).toContainEqual({
      href: 'https://aleromano.com/posts/my-post',
      hreflang: 'en-US'
    });
    expect(links).toContainEqual({
      href: 'https://aleromano.com/posts/it/my-post',
      hreflang: 'it-IT'
    });
  });
});
