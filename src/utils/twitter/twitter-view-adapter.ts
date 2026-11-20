function cleanTweetText(text: string, hasMedia: boolean): string {
  if (!hasMedia) return text;

  return text.replace(/\s*https:\/\/t\.co\/\w+\s*$/, '').trim();
}

function formatDate(dateString: string, lang: string = 'en'): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  };

  return date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', options);
}

function getRelativeTime(dateString: string, lang: string = 'en'): string {
  const now = new Date();
  const tweetDate = new Date(dateString);
  const diffMs = now.getTime() - tweetDate.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const currentYear = now.getFullYear();
  const tweetYear = tweetDate.getFullYear();
  
  switch (true) {
    case seconds < 60:
      return `${seconds}s`;
    case minutes < 60:
      return `${minutes}m`;
    case hours < 24:
      return `${hours}h`;
    case days < 7:
      return `${days}d`;
    case currentYear === tweetYear:
      return tweetDate.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    default:
      return tweetDate.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
  }
}

export interface TwitterPost {
  id: string;
  text: string;
  created_at: string;
  formattedDate: string;
  relativeTime: string;
  author_name: string;
  author_username: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
  url: string;
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

export class TwitterViewAdapter {
  static parseApiResponse(apiResponse: TwitterApiResponse, currentLanguage: string = 'en'): TwitterPost[] {
    const posts: TwitterPost[] = [];

    if (apiResponse.data) {
      for (const tweet of apiResponse.data) {
        const author = apiResponse.includes?.users?.find(user => user.id === tweet.author_id);
        
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
          
          if (mediaItems.length > 0) {
            media = mediaItems;
          }
        }
        
        const cleanText = cleanTweetText(tweet.text, Boolean(media?.length));
        
        posts.push({
          id: tweet.id,
          text: cleanText,
          created_at: tweet.created_at,
          formattedDate: formatDate(tweet.created_at, currentLanguage),
          relativeTime: getRelativeTime(tweet.created_at, currentLanguage),
          author_name: author?.name || 'Alessandro Romano',
          author_username: author?.username || '_aleromano',
          public_metrics: tweet.public_metrics,
          url: `https://twitter.com/${author?.username || '_aleromano'}/status/${tweet.id}`,
          media,
        });
      }
    }

    posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return posts.slice(0, 6);
  }
}
