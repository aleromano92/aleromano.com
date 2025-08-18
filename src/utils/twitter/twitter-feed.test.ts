import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTwitterFeedData } from './twitter-feed';
import { DataFreshness } from './twitter';

// Mock the entire twitter module
vi.mock('./twitter', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    getTwitterPosts: vi.fn(),
    getTwitterPostsMock: vi.fn(() => ({
      posts: [
        {
          id: 'mock-1',
          text: 'Mock tweet for testing',
          author_name: 'Test User',
          author_username: 'testuser',
          created_at: '2024-01-15T10:00:00.000Z',
          public_metrics: { retweet_count: 0, like_count: 0, reply_count: 0 },
          url: 'https://twitter.com/testuser/status/mock-1',
          type: 'tweet'
        }
      ],
      freshness: actual.DataFreshness.MOCK
    }))
  };
});

describe('twitter-feed.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('development mode fallback', () => {
    it('should return mock data when NODE_ENV is not production and API fails', async () => {
      // Mock NODE_ENV as development
      const originalNodeEnv = import.meta.env.NODE_ENV;
      vi.stubEnv('NODE_ENV', 'development');
      
      // Mock getTwitterPosts to throw an error (like 429 rate limit)
      const { getTwitterPosts, DataFreshness } = await import('./twitter');
      vi.mocked(getTwitterPosts).mockRejectedValueOnce(new Error('429 Too Many Requests'));
      
      const result = await getTwitterFeedData();
      
      expect(result.posts).toBeDefined();
      expect(result.posts).toHaveLength(1);
      expect(result.freshness).toBe(DataFreshness.MOCK);
      expect(result.posts![0].text).toBe('Mock tweet for testing');
      
      // Restore NODE_ENV
      vi.stubEnv('NODE_ENV', originalNodeEnv);
    });

    it('should return error in production when API fails', async () => {
      // Mock NODE_ENV as production
      vi.stubEnv('NODE_ENV', 'production');
      
      // Mock getTwitterPosts to throw an error
      const { getTwitterPosts } = await import('./twitter');
      vi.mocked(getTwitterPosts).mockRejectedValueOnce(new Error('429 Too Many Requests'));
      
      const result = await getTwitterFeedData();
      
      expect(result.posts).toBeNull();
      expect(result.error).toBe('Twitter API rate limit exceeded'); // The error message is transformed by twitter-feed
      expect(result.freshness).toBeUndefined();
    });

    it('should return live data when API succeeds', async () => {
      // Mock getTwitterPosts to succeed
      const { getTwitterPosts, DataFreshness } = await import('./twitter');
      vi.mocked(getTwitterPosts).mockResolvedValueOnce({
        posts: [
          {
            id: 'live-1',
            text: 'Live tweet from API',
            author_name: 'Real User',
            author_username: 'realuser',
            created_at: '2024-01-15T12:00:00.000Z',
            public_metrics: { retweet_count: 5, like_count: 10, reply_count: 2 },
            url: 'https://twitter.com/realuser/status/live-1',
            type: 'tweet'
          }
        ],
        freshness: DataFreshness.LIVE
      });
      
      const result = await getTwitterFeedData();
      
      expect(result.posts).toBeDefined();
      expect(result.posts).toHaveLength(1);
      expect(result.freshness).toBe(DataFreshness.LIVE);
      expect(result.posts![0].text).toBe('Live tweet from API');
      expect(result.error).toBeUndefined();
    });
  });
});