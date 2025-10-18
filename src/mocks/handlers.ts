/**
 * MSW Request Handlers for Twitter API
 * 
 * These handlers intercept Twitter API calls and return mock data
 * during development and testing, avoiding real API calls and rate limits.
 */
import { http, HttpResponse } from 'msw';
import mockTwitterApiResponse from '../utils/twitter/mock-twitter-api-response-with-media.json';

// Alessandro Romano's Twitter user ID
const TWITTER_USER_ID = '4266046641';

export const handlers = [
  // Mock Twitter user timeline endpoint
  http.get(`https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets`, () => {
    console.log('[MSW] Intercepted Twitter API call - returning mock data');
    return HttpResponse.json(mockTwitterApiResponse);
  }),
];
