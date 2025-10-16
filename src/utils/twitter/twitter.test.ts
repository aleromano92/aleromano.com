import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mockTwitterApiResponse from './mock-twitter-api-response-with-media.json';

const CURRENT_LANGUAGE = 'en';

// Mock the database module before importing twitter module
const mockCacheManager = {
  set: vi.fn(),
  get: vi.fn(),
  getStale: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  clearExpired: vi.fn(),
  clearAll: vi.fn(),
};

vi.mock('../database', () => ({
  cacheManager: mockCacheManager
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocks are set up
const { getTwitterPosts, DataFreshness } = await import('./twitter');

// Mock process.env
const mockEnv = vi.hoisted(() => ({
  NODE_ENV: 'test',
  TWITTER_BEARER_TOKEN: 'a-token'
}));

vi.stubGlobal('process', {
  env: mockEnv
});

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      TWITTER_BEARER_TOKEN: 'a-token'
    }
  }
});

describe('twitter.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset cache manager mocks
    mockCacheManager.get.mockReturnValue(null);
    mockCacheManager.getStale.mockReturnValue(null);
    mockCacheManager.has.mockReturnValue(false);
    
    // Reset environment to test mode
    mockEnv.NODE_ENV = 'test';
    mockEnv.TWITTER_BEARER_TOKEN = 'a-token';
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('getTwitterPosts', () => {
    it('should fetch and return Twitter posts successfully', async () => {
      // Set to production mode to test actual API behavior
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      // First call: cache miss
      mockCacheManager.get.mockReturnValueOnce(null);
      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
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

      // Capture what was cached
      const cachedData = mockCacheManager.set.mock.calls[0][1];

      // Second call: cache hit
      mockCacheManager.get.mockReturnValueOnce(cachedData);
      const response2 = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response2.posts).not.toBeNull();
      expect(response2.posts![0].author_name).toBe('Alessandro Romano');
      expect(response2.posts![0].author_username).toBe('_aleromano');
    });

    it('should return error when Bearer token is missing in production', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = undefined as any;
      
      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter API not configured');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should correctly identify retweets from raw API response', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = 'mock-bearer-token';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      expect(response.posts).not.toBeNull();
      const retweet = response.posts!.find((p: any) => p.text.startsWith('RT @'));
      
      expect(retweet?.text).toMatch(/^RT @/);
      expect(retweet?.author_name).toBe('Engineering Lead');
      expect(retweet?.author_username).toBe('engineering_lead');
    });

    it('should sort posts by creation date (newest first)', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = 'mock-bearer-token';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).not.toBeNull();
      expect(new Date(response.posts![0].created_at).getTime()).toBeGreaterThan(
        new Date(response.posts![1].created_at).getTime()
      );
    });

    it('should limit results to 6 posts', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = 'mock-bearer-token';
      
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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manyPosts)
      });

      const response = await getTwitterPosts(CURRENT_LANGUAGE);

      expect(response.posts).toHaveLength(6);
    });

    it('should handle missing author information gracefully', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = 'mock-bearer-token';
      
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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseWithMissingAuthor)
      });

      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).not.toBeNull();
      expect(response.posts![0].author_name).toBe('Alessandro Romano');
      expect(response.posts![0].author_username).toBe('_aleromano');
    });

    it('should return error when API request fails and no cache exists', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter API authentication failed');
    });

    it('should return specific error message for rate limiting (429)', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded')
      });

      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter API rate limit exceeded');
    });

    it('should return specific error message for not found (404)', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not Found')
      });

      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter user not found or API endpoint invalid');
    });

    it('should return generic error message for other errors', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toContain('500');
    });

    it('should reformat dates when language changes on cached data', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = 'mock-bearer-token';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      // First call in English - cache miss, fetches from API
      mockCacheManager.get.mockReturnValueOnce(null);
      const englishResponse = await getTwitterPosts('en');
      expect(englishResponse.posts).not.toBeNull();
      expect(englishResponse.freshness).toBe(DataFreshness.LIVE);
      
      // Capture what was cached
      const cachedData = mockCacheManager.set.mock.calls[0][1];
      
      // Second call in Italian - cache hit, uses cached API data but reformats with Italian locale
      mockCacheManager.get.mockReturnValueOnce(cachedData);
      const italianResponse = await getTwitterPosts('it');
      expect(italianResponse.posts).not.toBeNull();
      expect(italianResponse.freshness).toBe(DataFreshness.CACHE);
      
      // Both should have same content but different date formatting
      expect(englishResponse.posts!.length).toBe(italianResponse.posts!.length);
      expect(englishResponse.posts![0].id).toBe(italianResponse.posts![0].id);
      
      // The formatted dates should be different due to locale
      // English uses "Jan 15, 2024, 10:30 AM" format
      // Italian uses "15 gen 2024, 10:30" format
      expect(englishResponse.posts![0].formattedDate).not.toBe(italianResponse.posts![0].formattedDate);
      
      // Only one API call should have been made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle empty response data', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = 'mock-bearer-token';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toEqual([]);
      expect(response.freshness).toBe(DataFreshness.LIVE);
    });    
    
    it('should use mock data in non-production environment', async () => {
      // NODE_ENV is already 'test' from beforeEach
      
      // First call: cache.get returns null (cache miss)
      mockCacheManager.get.mockReturnValueOnce(null);
      const response1 = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response1.freshness).toBe(DataFreshness.MOCK);
      expect(response1.posts).not.toBeNull();
      expect(response1.posts!).toHaveLength(6);
      expect(response1.posts![0].author_username).toBe('_aleromano');
      expect(response1.posts![0]).toHaveProperty('public_metrics');
      expect(mockFetch).not.toHaveBeenCalled();
      
      // Verify mock data was stored in cache
      expect(mockCacheManager.set).toHaveBeenCalledOnce();
      const cachedData = mockCacheManager.set.mock.calls[0][1];
      
      // Second call: cache.get returns the cached data
      mockCacheManager.get.mockReturnValueOnce(cachedData);
      const response2 = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response2.freshness).toBe(DataFreshness.CACHE);
      expect(response2.posts).not.toBeNull();
      expect(response2.posts!).toHaveLength(6);
      expect(response2.posts).toEqual(response1.posts);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('caching behavior', () => {
    it('should cache results and return cached data on subsequent calls', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = 'mock-bearer-token';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      // First call: cache miss, fetches from API
      mockCacheManager.get.mockReturnValueOnce(null);
      const response1 = await getTwitterPosts(CURRENT_LANGUAGE);
      
      // Capture what was cached
      expect(mockCacheManager.set).toHaveBeenCalledOnce();
      const cachedData = mockCacheManager.set.mock.calls[0][1];
      
      // Second call: cache hit, returns cached data
      mockCacheManager.get.mockReturnValueOnce(cachedData);
      const response2 = await getTwitterPosts(CURRENT_LANGUAGE);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response1.posts).toEqual(response2.posts);
      expect(response2.freshness).toBe(DataFreshness.CACHE); // Second call uses cache
    });

    it('should refresh cache after TTL expires', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = 'mock-bearer-token';
      
      // Mock timers to control cache expiration
      vi.useFakeTimers();
      
      const updatedResponse = {
        data: [{
          id: 'updated123',
          text: 'Updated tweet',
          created_at: '2024-01-15T14:30:00.000Z',
          author_id: '4266046641',
          public_metrics: { retweet_count: 0, like_count: 0, reply_count: 0, quote_count: 0 }
        }],
        includes: {
          users: [{ id: '4266046641', name: 'Alessandro Romano', username: '_aleromano' }]
        }
      };
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTwitterApiResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedResponse)
        });

      // First call - cache miss, should fetch fresh data and cache it
      mockCacheManager.get.mockReturnValueOnce(null);
      const response1 = await getTwitterPosts(CURRENT_LANGUAGE);
      expect(response1.freshness).toBe(DataFreshness.LIVE);
      
      // Fast forward past cache TTL (36 hours + 1 hour)
      vi.advanceTimersByTime(37 * 60 * 60 * 1000);
      
      // Second call - cache expired (returns null), should fetch fresh data
      mockCacheManager.get.mockReturnValueOnce(null);
      const response2 = await getTwitterPosts(CURRENT_LANGUAGE);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response2.posts).not.toBeNull();
      expect(response2.posts![0].text).toBe('Updated tweet');
      expect(response2.freshness).toBe(DataFreshness.LIVE);
      
      vi.useRealTimers();
    });

    it('should return cached data when new fetch fails', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = 'mock-bearer-token';
      
      vi.useFakeTimers();
      
      // First successful call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      mockCacheManager.get.mockReturnValueOnce(null);
      const initialResponse = await getTwitterPosts(CURRENT_LANGUAGE);
      expect(initialResponse.freshness).toBe(DataFreshness.LIVE);
      
      // Capture what was cached
      const cachedData = mockCacheManager.set.mock.calls[0][1];
      
      // Fast forward past cache TTL (36 hours + 1 hour)
      vi.advanceTimersByTime(37 * 60 * 60 * 1000);
      
      // Second call fails, but should return stale cached data
      mockFetch.mockRejectedValueOnce(new Error('API down'));
      
      // Cache.get returns null (expired), but getStale returns the stale data
      mockCacheManager.get.mockReturnValueOnce(null);
      mockCacheManager.getStale.mockReturnValueOnce(cachedData);

      const cachedResponse = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(cachedResponse.posts).toEqual(initialResponse.posts);
      expect(cachedResponse.freshness).toBe(DataFreshness.CACHE); // Stale cache returned
      
      vi.useRealTimers();
    });
  });
});