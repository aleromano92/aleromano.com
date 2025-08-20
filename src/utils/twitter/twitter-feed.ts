import { getTwitterPosts, type TwitterPost, DataFreshness } from './twitter';

export interface TwitterFeedData {
  posts: TwitterPost[] | null;
  error?: string;
  freshness?: DataFreshness;
}

export async function getTwitterFeedData(): Promise<TwitterFeedData> {
  try {
    const response = await getTwitterPosts();
    
    return { 
      posts: response.posts, 
      freshness: response.freshness 
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
      error: errorMessage
    };
  }
}