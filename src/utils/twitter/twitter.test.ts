import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTwitterPosts, clearCache, DataFreshness } from './twitter';
import mockTwitterApiResponse from './mock-twitter-api-response-with-media.json';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock process.env
const mockEnv = vi.hoisted(() => ({
  NODE_ENV: 'test',
  TWITTER_BEARER_TOKEN: undefined
}));

vi.stubGlobal('process', {
  env: mockEnv
});

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      TWITTER_BEARER_TOKEN: undefined
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
    mockEnv.TWITTER_BEARER_TOKEN = undefined;
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

      const response = await getTwitterPosts('mock-bearer-token');

      expect(response.posts).toHaveLength(6);
      expect(response.freshness).toBe(DataFreshness.LIVE);
      expect(response.posts[0]).toMatchObject({
        id: '1747982341234567890',
        text: expect.stringContaining('Just shipped a new feature!'),
        author_name: 'Alessandro Romano',
        author_username: '_aleromano',
        type: 'tweet'
      });
    });

    it('should correctly identify retweets from raw API response', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      const response = await getTwitterPosts('mock-bearer-token');
      const retweet = response.posts.find((p: any) => p.text.startsWith('RT @'));
      
      expect(retweet?.type).toBe('retweet');
      expect(retweet?.author_name).toBe('Engineering Lead');
      expect(retweet?.author_username).toBe('engineering_lead');
    });

    it('should sort posts by creation date (newest first)', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      const response = await getTwitterPosts('mock-bearer-token');
      
      expect(new Date(response.posts[0].created_at).getTime()).toBeGreaterThan(
        new Date(response.posts[1].created_at).getTime()
      );
    });

    it('should limit results to 6 posts', async () => {
      mockEnv.NODE_ENV = 'production';
      
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

      const response = await getTwitterPosts('mock-bearer-token');

      expect(response.posts).toHaveLength(6);
    });

    it('should handle missing author information gracefully', async () => {
      mockEnv.NODE_ENV = 'production';
      
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

      const response = await getTwitterPosts('mock-bearer-token');
      
      expect(response.posts[0].author_name).toBe('Alessandro Romano');
      expect(response.posts[0].author_username).toBe('_aleromano');
    });

    it('should return mock data when Bearer token is missing in production', async () => {
      mockEnv.NODE_ENV = 'production';
      // Don't set any bearer token
      
      const response = await getTwitterPosts();
      
      // Should return mock data instead of throwing
      expect(response.posts).toBeDefined();
      expect(response.freshness).toBe(DataFreshness.MOCK);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return mock data when API request fails and no cache exists', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const response = await getTwitterPosts('mock-bearer-token');
      
      // Should return mock data as fallback when no cache exists
      expect(response.posts).toBeDefined();
      expect(response.freshness).toBe(DataFreshness.MOCK);
    });

    it('should handle empty response data', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: null })
      });

      const response = await getTwitterPosts('mock-bearer-token');

      expect(response.posts).toEqual([]);
      expect(response.freshness).toBe(DataFreshness.LIVE);
    });

    it('should generate correct Twitter URLs from raw API data', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      const response = await getTwitterPosts('mock-bearer-token');

      expect(response.posts[0].url).toBe('https://twitter.com/_aleromano/status/1747982341234567890');
    });

    it('should correctly parse all fields from raw API response', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      const response = await getTwitterPosts('mock-bearer-token');

      const post = response.posts[0];
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('text');
      expect(post).toHaveProperty('created_at');
      expect(post).toHaveProperty('author_name');
      expect(post).toHaveProperty('author_username');
      expect(post).toHaveProperty('public_metrics');
      expect(post).toHaveProperty('url');
      expect(post).toHaveProperty('type');
      expect(post.public_metrics).toHaveProperty('retweet_count');
      expect(post.public_metrics).toHaveProperty('like_count');
      expect(post.public_metrics).toHaveProperty('reply_count');
    });

    it('should parse media attachments from API response', async () => {
      mockEnv.NODE_ENV = 'production';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      const response = await getTwitterPosts('mock-bearer-token');
      
      const postsWithMedia = response.posts.filter((post: any) => post.media && post.media.length > 0);
      expect(postsWithMedia.length).toBeGreaterThan(0);      
      const postWithMedia = postsWithMedia[0];
      expect(postWithMedia.media).toBeDefined();
      expect(postWithMedia.media![0]).toHaveProperty('type');
      expect(postWithMedia.media![0]).toHaveProperty('url');
      expect(postWithMedia.media![0]).toHaveProperty('alt_text');
      expect(postWithMedia.media![0]).toHaveProperty('width');
      expect(postWithMedia.media![0]).toHaveProperty('height');
    });

    it('should use mock data in non-production environment', async () => {
      // NODE_ENV is already 'test' from beforeEach
      
      const response = await getTwitterPosts('mock-bearer-token');
      
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
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      // First call
      const response1 = await getTwitterPosts('mock-bearer-token');
      
      // Second call should use cache (no additional fetch)
      const response2 = await getTwitterPosts('mock-bearer-token');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response1.posts).toEqual(response2.posts);
      expect(response2.freshness).toBe(DataFreshness.CACHE); // Second call uses cache
    });

    it('should refresh cache after TTL expires', async () => {
      mockEnv.NODE_ENV = 'production';
      
      // Mock timers to control cache expiration
      vi.useFakeTimers();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTwitterApiResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockTwitterApiResponse,
            data: [{
              ...mockTwitterApiResponse.data[0],
              text: 'Updated tweet',
              id: 'updated123'
            }]
          })
        });

      // First call
      await getTwitterPosts('mock-bearer-token');
      
      // Fast forward past cache TTL (30 minutes + 1 minute)
      vi.advanceTimersByTime(31 * 60 * 1000);
      
      // Second call should fetch fresh data
      const response = await getTwitterPosts('mock-bearer-token');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response.posts[0].text).toBe('Updated tweet');
      
      vi.useRealTimers();
    });

    it('should return cached data when new fetch fails', async () => {
      mockEnv.NODE_ENV = 'production';
      
      vi.useFakeTimers();
      
      // First successful call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTwitterApiResponse)
      });

      const initialResponse = await getTwitterPosts('mock-bearer-token');
      
      // Fast forward past cache TTL (30 minutes + 1 minute)
      vi.advanceTimersByTime(31 * 60 * 1000);
      
      // Second call fails, but should return cached data
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const cachedResponse = await getTwitterPosts('mock-bearer-token');
      
      expect(cachedResponse.posts).toEqual(initialResponse.posts);
      expect(cachedResponse.freshness).toBe(DataFreshness.CACHE); // Stale cache returned
      
      vi.useRealTimers();
    });
  });
});