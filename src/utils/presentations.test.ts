import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  findPresentationByBlogPost, 
  parseSlides, 
  getPresentationUrl, 
  extractBlogPostSlugFromPathname 
} from './presentations';

// Mock Astro content collection
vi.mock('astro:content', () => ({
  getCollection: vi.fn()
}));

describe('presentations utils', () => {
  let mockGetCollection: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { getCollection } = await import('astro:content');
    mockGetCollection = vi.mocked(getCollection);
    vi.clearAllMocks();
    
    // Setup default mock data
    mockGetCollection.mockResolvedValue([
      {
        id: '3-career-tips.md',
        slug: '3-career-tips',
        body: 'Slide 1\n\n---\n\nSlide 2\n\n---\n\nSlide 3',
        collection: 'presentations',
        render: vi.fn(),
        data: {
          title: '3 Career Tips for Software Engineers',
          description: 'A presentation about career tips',
          blogPostSlug: '3-career-tips',
          language: 'en',
          theme: 'black',
          transition: 'slide'
        }
      },
      {
        id: '3-career-tips-it.md',
        slug: '3-career-tips-it',
        body: 'Diapositiva 1\n\n---\n\nDiapositiva 2',
        collection: 'presentations',
        render: vi.fn(),
        data: {
          title: '3 Consigli di Carriera',
          description: 'Una presentazione sui consigli di carriera',
          blogPostSlug: '3-career-tips',
          language: 'it',
          theme: 'white',
          transition: 'fade'
        }
      }
    ]);
  });

  describe('parseSlides', () => {
    it('should parse markdown content into slides using --- delimiters', () => {
      const content = 'First slide content\n\n---\n\nSecond slide content\n\n---\n\nThird slide content';
      const result = parseSlides(content);
      
      expect(result).toEqual([
        'First slide content',
        'Second slide content',
        'Third slide content'
      ]);
    });

    it('should handle empty slides by filtering them out', () => {
      const content = 'First slide\n\n---\n\n\n\n---\n\nThird slide';
      const result = parseSlides(content);
      
      expect(result).toEqual([
        'First slide',
        'Third slide'
      ]);
    });

    it('should handle content without delimiters', () => {
      const content = 'Single slide content';
      const result = parseSlides(content);
      
      expect(result).toEqual(['Single slide content']);
    });

    it('should handle empty content', () => {
      const result = parseSlides('');
      expect(result).toEqual([]);
    });

    it('should handle whitespace-only content', () => {
      const result = parseSlides('   \n  \n  ');
      expect(result).toEqual([]);
    });

    it('should trim whitespace from slides', () => {
      const content = '   First slide   \n\n---\n\n   Second slide   ';
      const result = parseSlides(content);
      
      expect(result).toEqual([
        'First slide',
        'Second slide'
      ]);
    });
  });

  describe('extractBlogPostSlugFromPathname', () => {
    it('should extract slug from English blog post URL', () => {
      const result = extractBlogPostSlugFromPathname('/posts/3-career-tips');
      expect(result).toBe('3-career-tips');
    });

    it('should extract slug from Italian blog post URL', () => {
      const result = extractBlogPostSlugFromPathname('/it/posts/3-career-tips');
      expect(result).toBe('3-career-tips');
    });

    it('should handle trailing slashes', () => {
      const result = extractBlogPostSlugFromPathname('/posts/3-career-tips/');
      expect(result).toBe('3-career-tips');
    });

    it('should handle multiple trailing slashes', () => {
      const result = extractBlogPostSlugFromPathname('/posts/3-career-tips///');
      expect(result).toBe('3-career-tips');
    });

    it('should handle root path', () => {
      const result = extractBlogPostSlugFromPathname('/');
      expect(result).toBeUndefined();
    });

    it('should handle empty string', () => {
      const result = extractBlogPostSlugFromPathname('');
      expect(result).toBeUndefined();
    });

    it('should handle path with only slashes', () => {
      const result = extractBlogPostSlugFromPathname('///');
      expect(result).toBeUndefined();
    });
  });

  describe('getPresentationUrl', () => {
    it('should generate correct URL for English blog post', () => {
      const result = getPresentationUrl('3-career-tips', 'en');
      expect(result).toBe('/posts/3-career-tips/present');
    });

    it('should generate correct URL for Italian blog post', () => {
      const result = getPresentationUrl('3-career-tips', 'it');
      expect(result).toBe('/it/posts/3-career-tips/present');
    });
  });

  describe('findPresentationByBlogPost', () => {
    it('should find presentation by exact blog post pathname and language match', async () => {
      const result = await findPresentationByBlogPost('/posts/3-career-tips', 'en');

      expect(result).toEqual({
        slug: '3-career-tips',
        title: '3 Career Tips for Software Engineers',
        description: 'A presentation about career tips',
        language: 'en',
        theme: 'black',
        transition: 'slide',
        url: '/posts/3-career-tips/present'
      });
    });

    it('should find Italian presentation when available', async () => {
      const result = await findPresentationByBlogPost('/it/posts/3-career-tips', 'it');

      expect(result).toEqual({
        slug: '3-career-tips-it',
        title: '3 Consigli di Carriera',
        description: 'Una presentazione sui consigli di carriera',
        language: 'it',
        theme: 'white',
        transition: 'fade',
        url: '/it/posts/3-career-tips/present'
      });
    });

    it('should return null when no presentation exists for blog post', async () => {
      const result = await findPresentationByBlogPost('/posts/nonexistent-post', 'en');
      expect(result).toBeNull();
    });

    it('should return null when presentation exists but not in requested language', async () => {
      // Mock only English presentation
      mockGetCollection.mockResolvedValue([
        {
          id: 'english-only.md',
          slug: 'english-only',
          body: 'English only content...',
          collection: 'presentations',
          render: vi.fn(),
          data: {
            title: 'English Only Presentation',
            blogPostSlug: 'english-only-post',
            language: 'en'
          }
        }
      ]);

      const result = await findPresentationByBlogPost('/it/posts/english-only-post', 'it');
      expect(result).toBeNull();
    });

    it('should handle presentations without optional fields', async () => {
      mockGetCollection.mockResolvedValue([
        {
          id: 'minimal.md',
          slug: 'minimal',
          body: 'Minimal content...',
          collection: 'presentations',
          render: vi.fn(),
          data: {
            title: 'Minimal Presentation',
            blogPostSlug: 'minimal-post',
            language: 'en'
            // No description, theme, or transition
          }
        }
      ]);

      const result = await findPresentationByBlogPost('/posts/minimal-post', 'en');

      expect(result).toEqual({
        slug: 'minimal',
        title: 'Minimal Presentation',
        description: undefined,
        language: 'en',
        theme: undefined,
        transition: undefined,
        url: '/posts/minimal-post/present'
      });
    });

    it('should handle getCollection errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockGetCollection.mockRejectedValue(new Error('Collection failed to load'));

      const result = await findPresentationByBlogPost('/posts/any-post', 'en');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error checking for presentation')
      );

      consoleSpy.mockRestore();
    });

    it('should call getCollection with correct collection name', async () => {
      await findPresentationByBlogPost('/posts/3-career-tips', 'en');
      expect(mockGetCollection).toHaveBeenCalledWith('presentations');
    });

    it('should return null for empty pathname', async () => {
      const result = await findPresentationByBlogPost('', 'en');
      expect(result).toBeNull();
    });

    it('should return null for root pathname', async () => {
      const result = await findPresentationByBlogPost('/', 'en');
      expect(result).toBeNull();
    });
  });
});