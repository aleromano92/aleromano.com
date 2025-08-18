import mockTwitterApiResponse from './mock-twitter-api-response-with-media.json';

export interface TwitterPost {
  id: string;
  text: string;
  created_at: string;
  author_name: string;
  author_username: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
  url: string;
  type: 'tweet' | 'retweet' | 'like';
  media?: {
    type: 'photo' | 'video' | 'animated_gif';
    url?: string;
    preview_image_url?: string;
    alt_text?: string;
    width?: number;
    height?: number;
  }[];
}

export enum DataFreshness {
  LIVE = 'LIVE',
  CACHE = 'CACHE', 
  MOCK = 'MOCK'
}

export interface TwitterResponse {
  posts: TwitterPost[];
  freshness: DataFreshness;
}

interface TwitterApiResponse {
  data: any[];
  includes?: {
    users?: any[];
    tweets?: any[];
    media?: any[];
  };
  meta?: {
    result_count?: number;
    next_token?: string;
  };
}

interface CacheEntry {
  data: TwitterPost[];
  timestamp: number;
  freshness: DataFreshness;
}

// Alessandro Romano's Twitter user ID (this never changes)
const TWITTER_USER_ID = '4266046641';

// 30 minutes TTL (twice the X API rate limit window)
const CACHE_TTL = 30 * 60 * 1000;

// In-memory cache
let cache: CacheEntry | null = null;

// Export function to clear cache (for testing)
export function clearCache(): void {
  cache = null;
}

function isCacheValid(): boolean {
  if (!cache) return false;
  
  const now = Date.now();
  const timeSinceCache = now - cache.timestamp;
  
  return timeSinceCache < CACHE_TTL;
}

// Parse raw Twitter API response to our TwitterPost format
function parseTwitterApiResponse(apiResponse: TwitterApiResponse): TwitterPost[] {
  const posts: TwitterPost[] = [];

  if (apiResponse.data) {
    for (const tweet of apiResponse.data) {
      const author = apiResponse.includes?.users?.find(user => user.id === tweet.author_id);
      
      // Parse media attachments if present
      let media: TwitterPost['media'] = undefined;
      if (tweet.attachments?.media_keys && apiResponse.includes?.media) {
        const mediaItems = tweet.attachments.media_keys
          .map((mediaKey: string) => {
            const mediaItem = apiResponse.includes?.media?.find(m => m.media_key === mediaKey);
            if (mediaItem) {
              return {
                type: mediaItem.type,
                url: mediaItem.url,
                preview_image_url: mediaItem.preview_image_url,
                alt_text: mediaItem.alt_text,
                width: mediaItem.width,
                height: mediaItem.height,
              };
            }
            return null;
          })
          .filter(Boolean);
        
        // Only include media array if it has items
        if (mediaItems.length > 0) {
          media = mediaItems;
        }
      }
      
      posts.push({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        author_name: author?.name || 'Alessandro Romano',
        author_username: author?.username || '_aleromano',
        public_metrics: tweet.public_metrics,
        url: `https://twitter.com/${author?.username || '_aleromano'}/status/${tweet.id}`,
        type: tweet.text.startsWith('RT @') ? 'retweet' : 'tweet',
        media,
      });
    }
  }

  // Sort by creation date (newest first) and take top 5
  posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return posts.slice(0, 5);
}

// Mock data from JSON file (raw API response format)
function getMockTwitterPosts(): TwitterPost[] {
  return parseTwitterApiResponse(mockTwitterApiResponse as TwitterApiResponse);
}

// Development-only function that returns mock data (for testing and development)
export function getTwitterPostsMock(): TwitterResponse {
  console.warn('Using mock Twitter data for development/testing');
  const mockData = getMockTwitterPosts();
  
  return {
    posts: mockData,
    freshness: DataFreshness.MOCK
  };
}

// Fetches raw data from Twitter API and parses it to TwitterPost[]
// Throws error if API call fails - no fallback logic here
async function fetchTwitterData(bearerToken?: string): Promise<TwitterPost[]> {
  const token = bearerToken || import.meta.env.TWITTER_BEARER_TOKEN;
  
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
  
  return parseTwitterApiResponse(timelineData);
}

// Caching wrapper that fetches Twitter data with graceful fallback to stale cache
export async function getTwitterPosts(bearerToken?: string): Promise<TwitterResponse> {
  // Return cached data if valid
  if (isCacheValid() && cache) {
    console.log('Using cached Twitter data');
    return {
      posts: cache.data,
      freshness: DataFreshness.CACHE
    };
  }

  try {
    // Fetch fresh data from Twitter API
    const posts = await fetchTwitterData(bearerToken);
    
    // Update cache with successful data
    cache = {
      data: posts,
      timestamp: Date.now(),
      freshness: DataFreshness.LIVE,
    };
    
    return {
      posts,
      freshness: DataFreshness.LIVE
    };
    
  } catch (error) {
    console.error('Twitter API error:', error);
    
    // If we have cached data, return it as fallback
    if (cache) {
      console.warn('Using stale cached Twitter data due to API error');
      return {
        posts: cache.data,
        freshness: DataFreshness.CACHE
      };
    }
    
    // No cache available, re-throw the error
    throw error;
  }
}