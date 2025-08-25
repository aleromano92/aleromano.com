/**
 * Twitter View Adapter
 * 
 * Responsible for transforming raw Twitter API responses into our application's TwitterPost format.
 * This adapter isolates the view layer from the Twitter API data structure, making it easier to
 * handle API changes and maintain consistent data representation across the application.
 */

/**
 * Clean the tweet text by removing t.co links if media is present
 */
function cleanTweetText(text: string, hasMedia: boolean): string {
  if (!hasMedia) return text;

  // Remove t.co links at the end of tweets when media is present
  return text.replace(/\s*https:\/\/t\.co\/\w+\s*$/, '').trim();
}

/**
 * Format date to Italian timezone (Europe/Rome) with localization support
 */
function formatDate(dateString: string, lang: string = 'en'): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome', // Convert UTC to Rome timezone (UTC+1/+2)
  };

  return date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', options);
}

export interface TwitterPost {
  id: string;
  text: string;
  created_at: string;
  formattedDate: string;
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

export interface TwitterApiResponse {
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

/**
 * Adapter class for transforming Twitter API responses to application format
 */
export class TwitterViewAdapter {
  /**
   * Transforms raw Twitter API response to our TwitterPost format
   */
  static parseApiResponse(apiResponse: TwitterApiResponse, currentLanguage: string = 'en'): TwitterPost[] {
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
        
        // Clean tweet text if media is present
        const cleanText = cleanTweetText(tweet.text, Boolean(media?.length));
        
        posts.push({
          id: tweet.id,
          text: cleanText,
          created_at: tweet.created_at,
          formattedDate: formatDate(tweet.created_at, currentLanguage),
          author_name: author?.name || 'Alessandro Romano',
          author_username: author?.username || '_aleromano',
          public_metrics: tweet.public_metrics,
          url: `https://twitter.com/${author?.username || '_aleromano'}/status/${tweet.id}`,
          type: tweet.text.startsWith('RT @') ? 'retweet' : 'tweet',
          media,
        });
      }
    }

    // Sort by creation date (newest first) and take top 6
    posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return posts.slice(0, 6);
  }
}
