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
  // Mock Twitter user timeline endpoint (default: success)
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

// Additional handlers for specific error scenarios (use with server.use() in tests)
export const twitterErrorHandlers = {
  unauthorized: http.get(`https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets`, () => {
    console.log('[MSW] Intercepted Twitter API call - returning 401 Unauthorized');
    return new HttpResponse('Unauthorized', { status: 401 });
  }),
  
  notFound: http.get(`https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets`, () => {
    console.log('[MSW] Intercepted Twitter API call - returning 404 Not Found');
    return new HttpResponse('Not Found', { status: 404 });
  }),
  
  rateLimit: http.get(`https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets`, () => {
    console.log('[MSW] Intercepted Twitter API call - returning 429 Rate Limit');
    return new HttpResponse('Rate limit exceeded', { status: 429 });
  }),
  
  serverError: http.get(`https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets`, () => {
    console.log('[MSW] Intercepted Twitter API call - returning 500 Server Error');
    return new HttpResponse('Internal Server Error', { status: 500 });
  }),
  
  networkError: http.get(`https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets`, () => {
    console.log('[MSW] Intercepted Twitter API call - returning network error');
    return HttpResponse.error();
  }),
  
  emptyResponse: http.get(`https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets`, () => {
    console.log('[MSW] Intercepted Twitter API call - returning empty data');
    return HttpResponse.json({ data: [] });
  }),
  
  customResponse: (data: Record<string, unknown>) => 
    http.get(`https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets`, () => {
      console.log('[MSW] Intercepted Twitter API call - returning custom data');
      return HttpResponse.json(data);
    }),
};

// Additional handlers for GitHub API error scenarios (use with server.use() in tests)
export const githubErrorHandlers = {
  notFound: http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
    console.log('[MSW] Intercepted GitHub API call - returning 404 Not Found');
    return new HttpResponse(null, { status: 404 });
  }),
  
  networkError: http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
    console.log('[MSW] Intercepted GitHub API call - returning network error');
    return HttpResponse.error();
  }),
  
  emptyResponse: http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
    console.log('[MSW] Intercepted GitHub API call - returning empty array');
    return HttpResponse.json([]);
  }),
  
  withMergeCommits: http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
    console.log('[MSW] Intercepted GitHub API call - returning commits with merge commit');
    return HttpResponse.json([
      {
        sha: 'abc123def456789',
        commit: {
          message: 'Merge pull request #123 from feature-branch',
          author: {
            name: 'Alessandro Romano',
            date: '2024-01-15T10:30:00Z'
          }
        },
        html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/abc123def456789`
      },
      {
        sha: 'def456abc123789',
        commit: {
          message: 'Add actual feature',
          author: {
            name: 'Alessandro Romano',
            date: '2024-01-15T09:30:00Z'
          }
        },
        html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/def456abc123789`
      }
    ]);
  }),
  
  singleCommitFullSha: http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
    console.log('[MSW] Intercepted GitHub API call - returning single commit with full SHA');
    return HttpResponse.json([
      {
        sha: 'abcdef123456789fullhash',
        commit: {
          message: 'Test commit',
          author: {
            name: 'Alessandro Romano',
            date: '2024-01-15T10:30:00Z'
          }
        },
        html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/abcdef123456789fullhash`
      }
    ]);
  }),
  
  multiLineMessage: http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
    console.log('[MSW] Intercepted GitHub API call - returning commit with multi-line message');
    return HttpResponse.json([
      {
        sha: 'abc123def456789',
        commit: {
          message: 'First line of commit\n\nSecond line\nThird line',
          author: {
            name: 'Alessandro Romano',
            date: '2024-01-15T10:30:00Z'
          }
        },
        html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/abc123def456789`
      }
    ]);
  }),
  
  unsortedCommits: http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
    console.log('[MSW] Intercepted GitHub API call - returning unsorted commits');
    return HttpResponse.json([
      {
        sha: 'older123',
        commit: {
          message: 'Older commit',
          author: {
            name: 'Alessandro Romano',
            date: '2024-01-14T10:30:00Z'
          }
        },
        html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/older123`
      },
      {
        sha: 'newer456',
        commit: {
          message: 'Newer commit',
          author: {
            name: 'Alessandro Romano',
            date: '2024-01-15T10:30:00Z'
          }
        },
        html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/newer456`
      }
    ]);
  }),
  
  recentCommit: http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
    console.log('[MSW] Intercepted GitHub API call - returning recent commit (2 hours ago)');
    return HttpResponse.json([
      {
        sha: 'abc123def456789',
        commit: {
          message: 'Recent commit',
          author: {
            name: 'Alessandro Romano',
            date: '2024-01-15T10:30:00Z' // 2 hours ago from fixed time 2024-01-15T12:30:00Z
          }
        },
        html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/abc123def456789`
      }
    ]);
  }),
  
  longMessage: http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
    console.log('[MSW] Intercepted GitHub API call - returning commit with long message');
    const longMessage = 'A'.repeat(200); // 200 character message
    return HttpResponse.json([
      {
        sha: 'abc123def456789',
        commit: {
          message: longMessage,
          author: {
            name: 'Alessandro Romano',
            date: '2024-01-15T10:30:00Z'
          }
        },
        html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/abc123def456789`
      }
    ]);
  }),
  
  customResponse: (commits: Array<Record<string, unknown>>) => 
    http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
      console.log('[MSW] Intercepted GitHub API call - returning custom commits data');
      return HttpResponse.json(commits);
    }),
};
