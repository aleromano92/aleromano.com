import mockTwitterApiResponse from './mock-twitter-api-response-with-media.json';
import { TwitterViewAdapter, type TwitterPost, type TwitterApiResponse } from './twitter-view-adapter';

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

// 30 minutes TTL (twice the X API rate limit window)
const CACHE_TTL = 30 * 60 * 1000;

/**
 * Interface for different Twitter data retrieval strategies
 */
interface TwitterDataStrategy {
  fetchRawData(): Promise<TwitterRawDataResponse>;
}

/**
 * Simple in-memory cache for Twitter API responses
 */
class TwitterCache {
  private cachedData: TwitterApiResponse | null = null;
  private cacheTimestamp: number = 0;

  public set(apiResponse: TwitterApiResponse): void {
    this.cachedData = apiResponse;
    this.cacheTimestamp = Date.now();
  }

  public get(): TwitterApiResponse | null {
    if (!this.isValid()) {
      return null;
    }
    return this.cachedData;
  }

  public getStale(): TwitterApiResponse | null {
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
  constructor() {}

  async fetchRawData(): Promise<TwitterRawDataResponse> {
    console.warn('Using mock Twitter data for development/testing');
    return {
      apiResponse: mockTwitterApiResponse as TwitterApiResponse,
      freshness: DataFreshness.MOCK
    };
  }
}

/**
 * Strategy for fetching live data from Twitter API with caching
 */
class LiveTwitterStrategy implements TwitterDataStrategy {
  constructor() {}

  async fetchRawData(): Promise<TwitterRawDataResponse> {
    // Check cache first
    const cachedApiResponse = twitterCache.get();
    if (cachedApiResponse) {
      console.log('Using cached Twitter data');
      return {
        apiResponse: cachedApiResponse,
        freshness: DataFreshness.CACHE
      };
    }

    try {
      // Fetch fresh data from API
      const apiResponse = await this.fetchFromApi();
      
      // Update cache with successful data
      twitterCache.set(apiResponse);
      
      return {
        apiResponse,
        freshness: DataFreshness.LIVE
      };
      
    } catch (error) {
      throw new Error(`Failed to fetch Twitter data: ${error}`);
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
      `max_results=10`;

    const timelineResponse = await fetch(timelineUrl, { headers });

    if (!timelineResponse.ok) {
      const errorText = await timelineResponse.text();
      throw new Error(`Twitter Timeline error: ${timelineResponse.status} - ${errorText}`);
    }

    return await timelineResponse.json();
  }
}

/**
 * Production strategy that gracefully handles API failures with stale cache fallback
 */
class ProductionTwitterStrategy implements TwitterDataStrategy {
  private liveStrategy: LiveTwitterStrategy;

  constructor() {
    this.liveStrategy = new LiveTwitterStrategy();
  }

  async fetchRawData(): Promise<TwitterRawDataResponse> {
    try {
      return await this.liveStrategy.fetchRawData();
    } catch (error) {
      console.warn('Twitter API error:', error);
      
      // Try to use any cached data as fallback (even if stale)
      const staleCachedApiResponse = twitterCache.getStale();
      if (staleCachedApiResponse) {
        console.warn('Using stale cached Twitter data due to API error');
        return {
          apiResponse: staleCachedApiResponse,
          freshness: DataFreshness.CACHE
        };
      }
      
      // Re-throw the error to be handled by the main function
      throw error;
    }
  }
}

/**
 * Factory to create the appropriate Twitter data strategy based on environment
 */
class TwitterStrategyFactory {
  static create(): TwitterDataStrategy {
    const nodeEnv = import.meta.env.NODE_ENV || process.env.NODE_ENV;
    
    if (nodeEnv === 'production') {
      return new ProductionTwitterStrategy();
    } else {
      return new MockTwitterStrategy();
    }
  }
}

/**
 * Main function to get Twitter posts with comprehensive error handling
 * - Development/Test: Returns mock data
 * - Production: Fetches from API with caching and graceful error handling
 * 
 * This function handles all error scenarios internally and never throws.
 * Instead, it returns a TwitterResponse with error information when failures occur.
 * The language parameter is used to format dates and other localized content.
 */
export async function getTwitterPosts(language: string): Promise<TwitterResponse> {
  try {
    const strategy = TwitterStrategyFactory.create();
    const { apiResponse, freshness } = await strategy.fetchRawData();
    
    // Parse the API response with the current language for proper formatting
    const posts = TwitterViewAdapter.parseApiResponse(apiResponse, language);
    
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