import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTwitterPosts, clearCache, DataFreshness } from './twitter';
import mockTwitterApiResponse from './mock-twitter-api-response-with-media.json';

const CURRENT_LANGUAGE = 'en';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

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
    // Clear the in-memory cache between tests
    clearCache();
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

      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeDefined();
      expect(response.posts.length).toBeGreaterThan(0);
      expect(response.freshness).toBe(DataFreshness.LIVE);
      expect(response.posts[0]).toHaveProperty('id');
      expect(response.posts[0]).toHaveProperty('text');
      expect(response.posts[0]).toHaveProperty('created_at');
      expect(response.posts[0]).toHaveProperty('author_name');
      expect(response.posts[0]).toHaveProperty('author_username');
      expect(response.posts[0]).toHaveProperty('public_metrics');
      expect(response.posts[0]).toHaveProperty('url');
      expect(response.posts[0]).toHaveProperty('type');

      const response2 = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response2.posts[0].author_name).toBe('Alessandro Romano');
      expect(response2.posts[0].author_username).toBe('_aleromano');
    });

    it('should throw error when Bearer token is missing in production', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = undefined as any;
      
      await expect(getTwitterPosts(CURRENT_LANGUAGE)).rejects.toThrow('Twitter API unavailable and no cached data available');
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
      const retweet = response.posts.find((p: any) => p.text.startsWith('RT @'));
      
      expect(retweet?.type).toBe('retweet');
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
      
      expect(new Date(response.posts[0].created_at).getTime()).toBeGreaterThan(
        new Date(response.posts[1].created_at).getTime()
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
      
      expect(response.posts[0].author_name).toBe('Alessandro Romano');
      expect(response.posts[0].author_username).toBe('_aleromano');
    });

    it('should throw error when Bearer token is missing in production', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.TWITTER_BEARER_TOKEN = undefined as any;
      
      await expect(getTwitterPosts(CURRENT_LANGUAGE)).rejects.toThrow('Twitter API unavailable and no cached data available');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw error when API request fails and no cache exists', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      await expect(getTwitterPosts(CURRENT_LANGUAGE)).rejects.toThrow('Twitter API unavailable and no cached data available');
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
      
      const response = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.freshness).toBe(DataFreshness.MOCK);
      expect(response.posts).toHaveLength(6);
      expect(response.posts[0].author_username).toBe('_aleromano');
      expect(response.posts[0]).toHaveProperty('public_metrics');
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

      // First call
      const response1 = await getTwitterPosts(CURRENT_LANGUAGE);
      
      // Second call should use cache (no additional fetch)
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

      // First call - should fetch fresh data and cache it
      const response1 = await getTwitterPosts(CURRENT_LANGUAGE);
      expect(response1.freshness).toBe(DataFreshness.LIVE);
      
      // Fast forward past cache TTL (30 minutes + 1 minute)
      vi.advanceTimersByTime(31 * 60 * 1000);
      
      // Second call should fetch fresh data since cache expired
      const response2 = await getTwitterPosts(CURRENT_LANGUAGE);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response2.posts[0].text).toBe('Updated tweet');
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

      const initialResponse = await getTwitterPosts(CURRENT_LANGUAGE);
      expect(initialResponse.freshness).toBe(DataFreshness.LIVE);
      
      // Fast forward past cache TTL (30 minutes + 1 minute)
      vi.advanceTimersByTime(31 * 60 * 1000);
      
      // Second call fails, but should return cached data
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const cachedResponse = await getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(cachedResponse.posts).toEqual(initialResponse.posts);
      expect(cachedResponse.freshness).toBe(DataFreshness.CACHE); // Stale cache returned
      
      vi.useRealTimers();
    });
  });
});