import { TwitterViewAdapter, type TwitterPost, type TwitterApiResponse } from './twitter-view-adapter';
import { cacheManager, type CacheManager } from '../database';

export type { TwitterPost } from './twitter-view-adapter';

export enum DataFreshness {
  LIVE = 'LIVE',
  CACHE = 'CACHE',
  MOCK = 'MOCK'
}

export interface TwitterResponse {
  posts: TwitterPost[] | null;
  freshness?: DataFreshness;
  error?: string;
}

export interface TwitterRawDataResponse {
  apiResponse: TwitterApiResponse;
  freshness: DataFreshness;
}

// Alessandro Romano's Twitter user ID (this never changes)
const TWITTER_USER_ID = '4266046641';

// 72 hours TTL (reduces API calls while keeping content reasonably fresh)
const CACHE_TTL = 72 * 60 * 60 * 1000;

// Cache key for Twitter API responses
const TWITTER_CACHE_KEY = 'twitter:timeline';

/**
 * TwitterService - handles fetching Twitter data with caching and error handling
 */
export class TwitterService {
  private adapter: typeof TwitterViewAdapter;
  private cache: CacheManager;

  constructor(adapter: typeof TwitterViewAdapter, cache: CacheManager) {
    this.adapter = adapter;
    this.cache = cache;
  }

  async getTwitterPosts(language: string): Promise<TwitterResponse> {
    try {
      const { apiResponse, freshness } = await this.fetchRawData();
      
      const posts = this.adapter.parseApiResponse(apiResponse, language);
      
      return {
        posts,
        freshness
      };
    } catch (error) {
      console.error('Failed to load Twitter feed:', error);

      // Provide more specific error messages based on the error type
      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        if (error.message.includes('Bearer Token not configured')) {
          errorMessage = 'Twitter API not configured';
        } else if (error.message.includes('404')) {
          errorMessage = 'Twitter user not found or API endpoint invalid';
        } else if (error.message.includes('401')) {
          errorMessage = 'Twitter API authentication failed';
        } else if (error.message.includes('429')) {
          errorMessage = 'Twitter API rate limit exceeded';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        posts: null,
        error: errorMessage,
      };
    }
  }

  private async fetchRawData(): Promise<TwitterRawDataResponse> {
    // Check cache first
    const cached = this.cache.get(TWITTER_CACHE_KEY);
    if (cached) {
      console.log('Using cached Twitter data');
      return {
        apiResponse: JSON.parse(cached),
        freshness: DataFreshness.CACHE
      };
    }

    try {
      // Fetch fresh data from API
      const apiResponse = await this.fetchFromApi();
      
      // Update cache with successful data
      this.cache.set(TWITTER_CACHE_KEY, JSON.stringify(apiResponse), CACHE_TTL);
      
      return {
        apiResponse,
        freshness: DataFreshness.LIVE
      };
    } catch (error) {
      console.warn('Twitter API error:', error);
      
      // Try to use any cached data as fallback (even if stale)
      const staleCached = this.cache.getStale(TWITTER_CACHE_KEY);
      if (staleCached) {
        console.warn('Using stale cached Twitter data due to API error');
        return {
          apiResponse: JSON.parse(staleCached),
          freshness: DataFreshness.CACHE
        };
      }
      
      // No fallback available, re-throw the error
      throw error;
    }
  }

  private async fetchFromApi(): Promise<TwitterApiResponse> {
    const token = import.meta.env.TWITTER_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
    
    if (!token) {
      throw new Error('Twitter Bearer Token not configured');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Use hardcoded user ID (saves one API call vs username lookup)
    const userId = TWITTER_USER_ID;

    // Fetch user's timeline (tweets and retweets)
    const timelineUrl = `https://api.twitter.com/2/users/${userId}/tweets?` +
      `tweet.fields=created_at,public_metrics,author_id,attachments&` +
      `expansions=author_id,attachments.media_keys&` +
      `user.fields=name,username&` +
      `media.fields=type,url,preview_image_url,alt_text,width,height&` +
      `max_results=6`;

    const timelineResponse = await fetch(timelineUrl, { headers });

    if (!timelineResponse.ok) {
      const errorText = await timelineResponse.text();
      throw new Error(`Twitter Timeline error: ${timelineResponse.status} - ${errorText}`);
    }

    return await timelineResponse.json();
  }
}

// Export a default instance for convenience
export const twitterService = new TwitterService(TwitterViewAdapter, cacheManager);