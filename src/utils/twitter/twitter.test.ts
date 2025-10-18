import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { server } from '../../mocks/server';
import { twitterErrorHandlers } from '../../mocks/handlers';
import { TwitterService, DataFreshness } from './twitter';
import { TwitterViewAdapter } from './twitter-view-adapter';
import type { CacheManager } from '../database';

const CURRENT_LANGUAGE = 'en';

// Create a mock cache manager to avoid real SQLite calls
const createMockCache = (): CacheManager => ({
  get: vi.fn(),
  set: vi.fn(),
  getStale: vi.fn(),
  clearAll: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  clearExpired: vi.fn(),
});

describe('TwitterService', () => {
  let service: TwitterService;
  let mockCache: CacheManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Stub bearer token for all tests (will unstub in specific tests that need to test missing token)
    vi.stubEnv('TWITTER_BEARER_TOKEN', 'fake-token');
    
    // Create fresh mock cache for each test
    mockCache = createMockCache();
    
    // Create service with real TwitterViewAdapter and mocked cacheManager
    service = new TwitterService(TwitterViewAdapter, mockCache);
  });

  afterEach(() => {
    vi.clearAllTimers();
    // Clean up environment stubs
    vi.unstubAllEnvs();
  });

  describe('getTwitterPosts', () => {
    beforeEach(() => {
      vi.mocked(mockCache.get).mockReturnValueOnce(null);
      vi.mocked(mockCache.getStale).mockReturnValueOnce(null);
    });

    it('should fetch and return Twitter posts successfully', async () => {
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
      // Unstub the bearer token for this specific test
      vi.unstubAllEnvs();
      vi.stubEnv('TWITTER_BEARER_TOKEN', '');
      
      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter API not configured');
    });

    it('should correctly identify retweets from raw API response', async () => {
      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(response.posts).not.toBeNull();
      const retweet = response.posts!.find((p: any) => p.text.startsWith('RT @'));
      
      expect(retweet?.text).toMatch(/^RT @/);
      expect(retweet?.author_name).toBe('Engineering Lead');
      expect(retweet?.author_username).toBe('engineering_lead');
    });

    it('should sort posts by creation date (newest first)', async () => {
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
      
      server.use(twitterErrorHandlers.customResponse(manyPosts));

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
      
      server.use(twitterErrorHandlers.customResponse(responseWithMissingAuthor));

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).not.toBeNull();
      expect(response.posts![0].author_name).toBe('Alessandro Romano');
      expect(response.posts![0].author_username).toBe('_aleromano');
    });

    it('should return error when API request fails and no cache exists', async () => {
      server.use(twitterErrorHandlers.unauthorized);

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter API authentication failed');
    });

    it('should return specific error message for rate limiting (429)', async () => {
      server.use(twitterErrorHandlers.rateLimit);

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter API rate limit exceeded');
    });

    it('should return specific error message for not found (404)', async () => {
      server.use(twitterErrorHandlers.notFound);

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toBe('Twitter user not found or API endpoint invalid');
    });

    it('should return generic error message for other errors', async () => {
      server.use(twitterErrorHandlers.serverError);

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toBeNull();
      expect(response.error).toContain('500');
    });


    it('should handle empty response data', async () => {
      server.use(twitterErrorHandlers.emptyResponse);

      const response = await service.getTwitterPosts(CURRENT_LANGUAGE);
      
      expect(response.posts).toEqual([]);
      expect(response.freshness).toBe(DataFreshness.LIVE);
    });
  });

  describe('caching behavior', () => {
    it('should cache results and return cached data on subsequent calls', async () => {
      // First call: cache miss
      vi.mocked(mockCache.get).mockReturnValueOnce(null);
      const response1 = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(response1.freshness).toBe(DataFreshness.LIVE);
      expect(mockCache.set).toHaveBeenCalledWith(
        'twitter:timeline',
        expect.any(String),
        36 * 60 * 60 * 1000
      );
      
      // Capture what was cached
      const cachedData = vi.mocked(mockCache.set).mock.calls[0][1];
      
      // Second call: cache hit
      vi.mocked(mockCache.get).mockReturnValueOnce(cachedData);
      const response2 = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(response2.freshness).toBe(DataFreshness.CACHE);
      
      // Both responses should have the same data
      expect(response1.posts).toEqual(response2.posts);
    });

    it('should refresh cache after TTL expires', async () => {
      // First call: cache miss
      vi.mocked(mockCache.get).mockReturnValueOnce(null);
      const response1 = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(response1.freshness).toBe(DataFreshness.LIVE);
      expect(mockCache.set).toHaveBeenCalledWith(
        'twitter:timeline',
        expect.any(String),
        36 * 60 * 60 * 1000 // 36 hours TTL
      );
      
      // Second call: simulate cache expired (returns null again)
      vi.mocked(mockCache.get).mockReturnValueOnce(null);
      const response2 = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(response2.freshness).toBe(DataFreshness.LIVE);
      
      // Verify cache was set twice (once for each fresh fetch)
      expect(mockCache.set).toHaveBeenCalledTimes(2);
    });

    it('should return stale cached data when new fetch fails after TTL expires', async () => {
      // First call: cache miss, fetch succeeds
      vi.mocked(mockCache.get).mockReturnValueOnce(null);
      const initialResponse = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(initialResponse.freshness).toBe(DataFreshness.LIVE);
      
      // Capture what was cached
      const cachedData = vi.mocked(mockCache.set).mock.calls[0][1];
      
      // Second call: cache expired (get returns null), API fails, but getStale returns cached data
      vi.mocked(mockCache.get).mockReturnValueOnce(null);
      vi.mocked(mockCache.getStale).mockReturnValueOnce(cachedData);
      
      // Override MSW handler to return network error
      server.use(twitterErrorHandlers.networkError);
      
      // Second call fails, but should return stale cached data
      const cachedResponse = await service.getTwitterPosts(CURRENT_LANGUAGE);
      expect(cachedResponse.posts).toEqual(initialResponse.posts);
      expect(cachedResponse.freshness).toBe(DataFreshness.CACHE);
      expect(mockCache.getStale).toHaveBeenCalledWith('twitter:timeline');
    });
  });
});
