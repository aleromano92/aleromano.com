import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mockTwitterApiResponse from '../../mocks/mock-twitter-api-response-with-media.json';
import { TwitterService, DataFreshness, ProductionTwitterStrategy } from './twitter';
import { TwitterViewAdapter } from './twitter-view-adapter';

vi.mock('../database', () => ({
  cacheManager: {
    set: vi.fn(),
    get: vi.fn(),
    getStale: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clearExpired: vi.fn(),
    clearAll: vi.fn(),
  }
}));

// Import after mocking
import { cacheManager } from '../database';

const CURRENT_LANGUAGE = 'en';

describe('TwitterService', () => {
  let service: TwitterService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset cache manager mocks
    vi.mocked(cacheManager).get.mockReturnValue(null);
    vi.mocked(cacheManager).getStale.mockReturnValue(null);
    vi.mocked(cacheManager).has.mockReturnValue(false);
    
    // Create service with mocked dependencies
    service = new TwitterService(TwitterViewAdapter, {
      fetchRawData: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('getTwitterPosts', () => {
    it('should fetch and return Twitter posts successfully', async () => {
      // Mock strategy to return live data
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockResolvedValue({
          apiResponse: mockTwitterApiResponse,
          freshness: DataFreshness.LIVE
        })
      });

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeDefined();
      expect(response.posts).not.toBeNull();
      expect(response.posts!.length).toBeGreaterThan(0);
      expect(response.freshness).toBe(DataFreshness.LIVE);
      expect(response.posts![0]).toHaveProperty('id');
      expect(response.posts![0]).toHaveProperty('text');
      expect(response.posts![0]).toHaveProperty('created_at');
      expect(response.posts![0]).toHaveProperty('formattedDate');
      expect(response.posts![0]).toHaveProperty('relativeTime');
      expect(response.posts![0]).toHaveProperty('author_name');
      expect(response.posts![0]).toHaveProperty('author_username');
      expect(response.posts![0]).toHaveProperty('public_metrics');
      expect(response.posts![0]).toHaveProperty('url');
    });

    it('should return error when Bearer token is missing in production', async () => {
      // Mock strategy to simulate API error
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockRejectedValue(new Error('Twitter Bearer Token not configured'))
      });
      
      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter API not configured');
    });

    it('should correctly identify retweets from raw API response', async () => {
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockResolvedValue({
          apiResponse: mockTwitterApiResponse,
          freshness: DataFreshness.LIVE
        })
      });

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(response.posts).not.toBeNull();
      const retweet = response.posts!.find((p: any) => p.text.startsWith('RT @'));
      
      expect(retweet?.text).toMatch(/^RT @/);
      expect(retweet?.author_name).toBe('Engineering Lead');
      expect(retweet?.author_username).toBe('engineering_lead');
    });

    it('should sort posts by creation date (newest first)', async () => {
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockResolvedValue({
          apiResponse: mockTwitterApiResponse,
          freshness: DataFreshness.LIVE
        })
      });

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).not.toBeNull();
      expect(new Date(response.posts![0].created_at).getTime()).toBeGreaterThan(
        new Date(response.posts![1].created_at).getTime()
      );
    });

    it('should limit results to 6 posts', async () => {
      const manyPosts = {
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `post${i}`,
          text: `Tweet ${i}`,
          created_at: `2024-01-${15 - i}T10:30:00.000Z`,
          author_id: '4266046641',
          public_metrics: { retweet_count: 0, like_count: 0, reply_count: 0, quote_count: 0 }
        })),
        includes: {
          users: [{ id: '4266046641', name: 'Alessandro Romano', username: '_aleromano' }]
        }
      };
      
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockResolvedValue({
          apiResponse: manyPosts,
          freshness: DataFreshness.LIVE
        })
      });

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);

      expect(response.posts).toHaveLength(6);
    });

    it('should handle missing author information gracefully', async () => {
      const responseWithMissingAuthor = {
        data: [{
          id: '123',
          text: 'Test tweet',
          created_at: '2024-01-15T10:30:00.000Z',
          author_id: 'missing_user',
          public_metrics: { retweet_count: 0, like_count: 0, reply_count: 0, quote_count: 0 }
        }],
        includes: {
          users: [] // No users in includes
        }
      };
      
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockResolvedValue({
          apiResponse: responseWithMissingAuthor,
          freshness: DataFreshness.LIVE
        })
      });

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).not.toBeNull();
      expect(response.posts![0].author_name).toBe('Alessandro Romano');
      expect(response.posts![0].author_username).toBe('_aleromano');
    });

    it('should return error when API request fails and no cache exists', async () => {
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockRejectedValue(new Error('Twitter Timeline error: 401 - Unauthorized'))
      });

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter API authentication failed');
    });

    it('should return specific error message for rate limiting (429)', async () => {
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockRejectedValue(new Error('Twitter Timeline error: 429 - Rate limit exceeded'))
      });

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter API rate limit exceeded');
    });

    it('should return specific error message for not found (404)', async () => {
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockRejectedValue(new Error('Twitter Timeline error: 404 - Not Found'))
      });

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter user not found or API endpoint invalid');
    });

    it('should return generic error message for other errors', async () => {
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockRejectedValue(new Error('Twitter Timeline error: 500 - Internal Server Error'))
      });

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toContain('500');
    });

    it('should reformat dates when language changes on cached data', async () => {
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockResolvedValue({
          apiResponse: mockTwitterApiResponse,
          freshness: DataFreshness.LIVE
        })
      });

      // First call in English
      const englishResponse = await service.getTwitterPosts('en');
      expect(englishResponse.posts).not.toBeNull();
      expect(englishResponse.freshness).toBe(DataFreshness.LIVE);
      
      // Second call in Italian - same data but different formatting
      const italianResponse = await service.getTwitterPosts('it');
      expect(italianResponse.posts).not.toBeNull();
      expect(italianResponse.freshness).toBe(DataFreshness.LIVE);
      
      // Both should have same content but different date formatting
      expect(englishResponse.posts!.length).toBe(italianResponse.posts!.length);
      expect(englishResponse.posts![0].id).toBe(italianResponse.posts![0].id);
      
      // The formatted dates should be different due to locale
      expect(englishResponse.posts![0].formattedDate).not.toBe(italianResponse.posts![0].formattedDate);
    });

    it('should handle empty response data', async () => {
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockResolvedValue({
          apiResponse: { data: [] },
          freshness: DataFreshness.LIVE
        })
      });

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toEqual([]);
      expect(response.freshness).toBe(DataFreshness.LIVE);
    });
  });

  describe('caching behavior', () => {
    it('should cache results and return cached data on subsequent calls', async () => {
      // First call: cache miss
      vi.mocked(cacheManager).get.mockReturnValueOnce(null);
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockResolvedValue({
          apiResponse: mockTwitterApiResponse,
          freshness: DataFreshness.LIVE
        })
      });
      
      const response1 = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(response1.freshness).toBe(DataFreshness.LIVE);
      
      // Second call: cache hit
      vi.mocked(cacheManager).get.mockReturnValueOnce(JSON.stringify(mockTwitterApiResponse));
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockResolvedValue({
          apiResponse: mockTwitterApiResponse,
          freshness: DataFreshness.CACHE
        })
      });
      
      const response2 = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(response2.freshness).toBe(DataFreshness.CACHE);
    });

    it('should refresh cache after TTL expires', async () => {
      vi.useFakeTimers();
      
      // First call: cache miss, fetches from API
      vi.mocked(cacheManager).get.mockReturnValueOnce(null);
      service = new TwitterService(TwitterViewAdapter, {
        fetchRawData: vi.fn().mockResolvedValue({
          apiResponse: mockTwitterApiResponse,
          freshness: DataFreshness.LIVE
        })
      });
      
      const response1 = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(response1.freshness).toBe(DataFreshness.LIVE);
      
      // Fast forward past cache TTL (36 hours + 1 hour)
      vi.advanceTimersByTime(37 * 60 * 60 * 1000);
      
      // Second call - cache expired (returns null), should fetch fresh data
      vi.mocked(cacheManager).get.mockReturnValueOnce(null);
      const response2 = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(response2.freshness).toBe(DataFreshness.LIVE);
      
      vi.useRealTimers();
    });

    it('should return cached data when new fetch fails', async () => {
      vi.useFakeTimers();
      
      // Set up environment variable for API call
      vi.stubEnv('TWITTER_BEARER_TOKEN', 'fake-token');
      
      // Mock fetch to succeed on first call
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });
      
      // First successful call
      vi.mocked(cacheManager).get.mockReturnValueOnce(null);
      service = new TwitterService(TwitterViewAdapter, new ProductionTwitterStrategy(cacheManager));
      
      const initialResponse = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(initialResponse.freshness).toBe(DataFreshness.LIVE);
      
      // Fast forward past cache TTL
      vi.advanceTimersByTime(37 * 60 * 60 * 1000);
      
      // Mock fetch to fail on second call
      global.fetch = vi.fn().mockRejectedValue(new Error('API down'));
      
      // Second call fails, but should return stale cached data
      vi.mocked(cacheManager).get.mockReturnValueOnce(null);
      vi.mocked(cacheManager).getStale.mockReturnValueOnce(JSON.stringify(mockTwitterApiResponse));
      
      const cachedResponse = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(cachedResponse.posts).toEqual(initialResponse.posts);
      expect(cachedResponse.freshness).toBe(DataFreshness.CACHE);
      
      // Restore fetch
      global.fetch = originalFetch;
      
      vi.useRealTimers();
      vi.unstubAllEnvs();
    });
  });
});
