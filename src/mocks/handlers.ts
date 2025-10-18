/**
 * MSW Request Handlers for API Mocking
 * 
 * These handlers intercept API calls and return mock data
 * during development and testing, avoiding real API calls and rate limits.
 */
import { http, HttpResponse } from 'msw';
import mockTwitterApiResponse from './mock-twitter-api-response-with-media.json';
import mockGitHubCommits from './mock-github-commits-response.json';

// Alessandro Romano's Twitter user ID
const TWITTER_USER_ID = '4266046641';

// GitHub repository info
const GITHUB_USERNAME = 'aleromano92';
const GITHUB_REPO = 'aleromano.com';

export const handlers = [
  // Mock Twitter user timeline endpoint
  http.get(`https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets`, () => {
    console.log('[MSW] Intercepted Twitter API call - returning mock data');
    return HttpResponse.json(mockTwitterApiResponse);
  }),

  // Mock GitHub commits endpoint
  http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
    console.log('[MSW] Intercepted GitHub API call - returning mock data');
    return HttpResponse.json(mockGitHubCommits);
  }),
];
