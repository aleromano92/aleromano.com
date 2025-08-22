import mockTwitterApiResponse from './mock-twitter-api-response-with-media.json';
import { TwitterViewAdapter, type TwitterPost, type TwitterApiResponse } from './twitter-view-adapter';

export type { TwitterPost } from './twitter-view-adapter';

export enum DataFreshness {
  LIVE = 'LIVE',
  CACHE = 'CACHE', 
  MOCK = 'MOCK'
}

export interface TwitterResponse {
  posts: TwitterPost[];
  freshness: DataFreshness;
}

// Alessandro Romano's Twitter user ID (this never changes)
const TWITTER_USER_ID = '4266046641';

// 30 minutes TTL (twice the X API rate limit window)
const CACHE_TTL = 30 * 60 * 1000;

/**
 * Interface for different Twitter data retrieval strategies
 */
interface TwitterDataStrategy {
  fetchPosts(): Promise<TwitterResponse>;
}

/**
 * Simple in-memory cache for Twitter posts
 */
class TwitterCache {
  private cachedData: TwitterPost[] | null = null;
  private cacheTimestamp: number = 0;

  public set(posts: TwitterPost[]): void {
    this.cachedData = posts;
    this.cacheTimestamp = Date.now();
  }

  public get(): TwitterPost[] | null {
    if (!this.isValid()) {
      return null;
    }
    return this.cachedData;
  }

  public getStale(): TwitterPost[] | null {
    return this.cachedData; // Returns cached data even if expired
  }

  public isValid(): boolean {
    if (!this.cachedData) return false;
    
    const timeSinceCache = Date.now() - this.cacheTimestamp;
    return timeSinceCache < CACHE_TTL;
  }

  public clear(): void {
    this.cachedData = null;
    this.cacheTimestamp = 0;
  }
}

// Global cache instance
const twitterCache = new TwitterCache();

// Export function to clear cache (for testing)
export function clearCache(): void {
  twitterCache.clear();
}

/**
 * Strategy for returning mock Twitter data (development/testing only)
 */
class MockTwitterStrategy implements TwitterDataStrategy {
  async fetchPosts(): Promise<TwitterResponse> {
    console.warn('Using mock Twitter data for development/testing');
    const mockPosts = TwitterViewAdapter.parseApiResponse(mockTwitterApiResponse as TwitterApiResponse);
    
    return {
      posts: mockPosts,
      freshness: DataFreshness.MOCK
    };
  }
}

/**
 * Strategy for fetching live data from Twitter API with caching
 */
class LiveTwitterStrategy implements TwitterDataStrategy {
  constructor(private bearerToken?: string) {}

  async fetchPosts(): Promise<TwitterResponse> {
    // Check cache first
    const cachedPosts = twitterCache.get();
    if (cachedPosts) {
      console.log('Using cached Twitter data');
      return {
        posts: cachedPosts,
        freshness: DataFreshness.CACHE
      };
    }

    try {
      // Fetch fresh data from API
      const posts = await this.fetchFromApi();
      
      // Update cache with successful data
      twitterCache.set(posts);
      
      return {
        posts,
        freshness: DataFreshness.LIVE
      };
      
    } catch (error) {
      throw new Error(`Failed to fetch Twitter data: ${error}`);
    }
  }

  private async fetchFromApi(): Promise<TwitterPost[]> {
    const token = this.bearerToken || import.meta.env.TWITTER_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
    
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
      `max_results=10`;

    const timelineResponse = await fetch(timelineUrl, { headers });

    if (!timelineResponse.ok) {
      const errorText = await timelineResponse.text();
      throw new Error(`Twitter Timeline error: ${timelineResponse.status} - ${errorText}`);
    }

    const timelineData: TwitterApiResponse = await timelineResponse.json();
    
    return TwitterViewAdapter.parseApiResponse(timelineData);
  }
}

/**
 * Production strategy that gracefully handles API failures with stale cache fallback
 */
class ProductionTwitterStrategy implements TwitterDataStrategy {
  constructor(private bearerToken?: string) {}

  async fetchPosts(): Promise<TwitterResponse> {
    const liveStrategy = new LiveTwitterStrategy(this.bearerToken);

    try {
      return await liveStrategy.fetchPosts();
    } catch (error) {
      console.warn('Twitter API error:', error);
      
      // Try to use any cached data as fallback (even if stale)
      const staleCachedPosts = twitterCache.getStale();
      if (staleCachedPosts) {
        console.warn('Using stale cached Twitter data due to API error');
        return {
          posts: staleCachedPosts,
          freshness: DataFreshness.CACHE
        };
      }
      
      // In production, throw error instead of returning mock data
      throw new Error('Twitter API unavailable and no cached data available');
    }
  }
}

/**
 * Factory to create the appropriate Twitter data strategy based on environment
 */
class TwitterStrategyFactory {
  static create(bearerToken?: string): TwitterDataStrategy {
    const nodeEnv = import.meta.env.NODE_ENV || process.env.NODE_ENV;
    
    if (nodeEnv === 'production') {
      return new ProductionTwitterStrategy(bearerToken);
    } else {
      return new MockTwitterStrategy();
    }
  }
}

/**
 * Main function to get Twitter posts with appropriate strategy based on environment
 * - Development/Test: Returns mock data
 * - Production: Fetches from API with caching and graceful error handling
 */
export async function getTwitterPosts(bearerToken?: string): Promise<TwitterResponse> {
  const strategy = TwitterStrategyFactory.create(bearerToken);
  return await strategy.fetchPosts();
}