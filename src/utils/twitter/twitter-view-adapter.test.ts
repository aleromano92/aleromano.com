import { describe, it, expect } from 'vitest';
import { TwitterViewAdapter, type TwitterApiResponse } from './twitter-view-adapter';
import mockTwitterApiResponse from './mock-twitter-api-response-with-media.json';

describe('TwitterViewAdapter', () => {
  describe('parseApiResponse', () => {
    it('should correctly identify retweets from raw API response', () => {
      const posts = TwitterViewAdapter.parseApiResponse(mockTwitterApiResponse as TwitterApiResponse);
      const retweet = posts.find((p: any) => p.text.startsWith('RT @'));
      
      expect(retweet?.type).toBe('retweet');
      expect(retweet?.author_name).toBe('Engineering Lead');
      expect(retweet?.author_username).toBe('engineering_lead');
    });

    it('should sort posts by creation date (newest first)', () => {
      const posts = TwitterViewAdapter.parseApiResponse(mockTwitterApiResponse as TwitterApiResponse);
      
      expect(new Date(posts[0].created_at).getTime()).toBeGreaterThan(
        new Date(posts[1].created_at).getTime()
      );
    });

    it('should limit results to 6 posts', () => {
      const manyPosts = {
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `${1600000000000 + i}`,
          text: `Test tweet ${i}`,
          created_at: new Date(1600000000000 + i * 1000).toISOString(),
          author_id: '4266046641',
          public_metrics: {
            retweet_count: 0,
            like_count: 0,
            reply_count: 0,
          },
        })),
        includes: {
          users: [{
            id: '4266046641',
            name: 'Alessandro Romano',
            username: '_aleromano',
          }],
        },
      };

      const posts = TwitterViewAdapter.parseApiResponse(manyPosts as TwitterApiResponse);
      
      expect(posts).toHaveLength(6);
    });

    it('should handle missing author information gracefully', () => {
      const responseWithMissingAuthor = {
        data: [{
          id: '1747982341234567890',
          text: 'Test tweet',
          created_at: '2024-01-01T12:00:00.000Z',
          author_id: 'missing_user_id',
          public_metrics: {
            retweet_count: 5,
            like_count: 10,
            reply_count: 2,
          },
        }],
        includes: {
          users: [], // No users included
        },
      };

      const posts = TwitterViewAdapter.parseApiResponse(responseWithMissingAuthor as TwitterApiResponse);
      
      expect(posts[0].author_name).toBe('Alessandro Romano');
      expect(posts[0].author_username).toBe('_aleromano');
      expect(posts[0].url).toBe('https://twitter.com/_aleromano/status/1747982341234567890');
    });

    it('should handle empty response data', () => {
      const emptyResponse = { data: null };
      const posts = TwitterViewAdapter.parseApiResponse(emptyResponse as unknown as TwitterApiResponse);
      
      expect(posts).toEqual([]);
    });

    it('should generate correct Twitter URLs from raw API data', () => {
      const posts = TwitterViewAdapter.parseApiResponse(mockTwitterApiResponse as TwitterApiResponse);

      expect(posts[0].url).toBe('https://twitter.com/_aleromano/status/1747982341234567890');
    });

    it('should correctly parse all fields from raw API response', () => {
      const posts = TwitterViewAdapter.parseApiResponse(mockTwitterApiResponse as TwitterApiResponse);

      const post = posts[0];
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

    it('should parse media attachments from API response', () => {
      const posts = TwitterViewAdapter.parseApiResponse(mockTwitterApiResponse as TwitterApiResponse);
      
      const postsWithMedia = posts.filter((post: any) => post.media && post.media.length > 0);
      expect(postsWithMedia.length).toBeGreaterThan(0);      
      const postWithMedia = postsWithMedia[0];
      expect(postWithMedia.media).toBeDefined();
      expect(postWithMedia.media![0]).toHaveProperty('type');
      expect(postWithMedia.media![0]).toHaveProperty('url');
      expect(postWithMedia.media![0]).toHaveProperty('alt_text');
      expect(postWithMedia.media![0]).toHaveProperty('width');
      expect(postWithMedia.media![0]).toHaveProperty('height');
    });
  });
});
