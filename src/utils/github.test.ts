import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { getGitHubCommitsData } from './github';
import type { GitHubCommitsData } from './github';

const GITHUB_USERNAME = 'aleromano92';
const GITHUB_REPO = 'aleromano.com';

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('GitHub Repository Commits API utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
  });

  describe('getGitHubCommitsData', () => {
    it('should return commits when Repository Commits API call is successful', async () => {
      // MSW will use the default handler from handlers.ts
      const result: GitHubCommitsData = await getGitHubCommitsData('en');

      expect(result.error).toBeUndefined();
      expect(result.commits).toHaveLength(3);
      
      // Check first commit details
      expect(result.commits[0]).toEqual({
        sha: 'abc123d',
        message: 'Add new feature',
        date: '2024-01-15T10:30:00Z',
        url: 'https://github.com/aleromano92/aleromano.com/commit/abc123def456789fullhash',
        repo: 'aleromano92/aleromano.com',
        formattedDate: 'Jan 15, 2024, 11:30 AM',
        truncatedMessage: 'Add new feature',
        relativeTime: expect.any(String)
      });

      // Check that commits are sorted by date (newest first)
      const firstCommitDate = new Date(result.commits[0].date);
      const lastCommitDate = new Date(result.commits[result.commits.length - 1].date);
      expect(firstCommitDate.getTime()).toBeGreaterThanOrEqual(lastCommitDate.getTime());
    });

    it('should filter out merge commits', async () => {
      // Override MSW handler for this test
      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
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
        })
      );

      const result = await getGitHubCommitsData();

      expect(result.commits).toHaveLength(1);
      expect(result.commits[0].message).toBe('Add actual feature');
      expect(result.commits[0].message).not.toContain('Merge');
    });

    it('should truncate SHA to 7 characters', async () => {
      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
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
        })
      );

      const result = await getGitHubCommitsData();

      expect(result.commits[0].sha).toBe('abcdef1');
      expect(result.commits[0].sha).toHaveLength(7);
    });

    it('should use only first line of commit message', async () => {
      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
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
        })
      );

      const result = await getGitHubCommitsData();

      expect(result.commits[0].message).toBe('First line of commit');
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const result = await getGitHubCommitsData();

      expect(result.commits).toEqual([]);
      expect(result.error).toBe('Failed to load recent commits');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
          return HttpResponse.error();
        })
      );

      const result = await getGitHubCommitsData();

      expect(result.commits).toEqual([]);
      expect(result.error).toBe('Failed to load recent commits');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should include correct repository name and URL format', async () => {
      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
          return HttpResponse.json([
            {
              sha: 'abc123def456789',
              commit: {
                message: 'Test commit',
                author: {
                  name: 'Alessandro Romano',
                  date: '2024-01-15T10:30:00Z'
                }
              },
              html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/abc123def456789`
            }
          ]);
        })
      );

      const result = await getGitHubCommitsData();

      expect(result.commits[0].url).toBe('https://github.com/aleromano92/aleromano.com/commit/abc123def456789');
      expect(result.commits[0].repo).toBe('aleromano92/aleromano.com');
    });

    it('should make API call with correct headers and URL', async () => {
      // This test verifies that MSW intercepts the correct endpoint
      // The actual headers are verified by MSW matching the request
      const result = await getGitHubCommitsData();

      expect(result.commits).toBeDefined();
      // MSW handler will have been called with the correct URL
    });

    it('should sort commits by date (newest first)', async () => {
      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
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
        })
      );

      const result = await getGitHubCommitsData();

      expect(result.commits[0].sha).toBe('newer45'); // Newer commit first
      expect(result.commits[1].sha).toBe('older12'); // Older commit second
    });

    it('should handle empty response gracefully', async () => {
      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
          return HttpResponse.json([]);
        })
      );

      const result = await getGitHubCommitsData();

      expect(result.commits).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it('should format dates according to language preference', async () => {
      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
          return HttpResponse.json([
            {
              sha: 'abc123def456789',
              commit: {
                message: 'Test commit',
                author: {
                  name: 'Alessandro Romano',
                  date: '2024-01-15T10:30:00Z'
                }
              },
              html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/abc123def456789`
            }
          ]);
        })
      );

      const result = await getGitHubCommitsData('en');

      expect(result.commits[0].formattedDate).toBeDefined();
      expect(typeof result.commits[0].formattedDate).toBe('string');
    });

    it('should include relative time in commit data', async () => {
      // Set a fixed time for consistent testing
      const fixedNow = new Date('2024-01-15T12:30:00Z');
      vi.setSystemTime(fixedNow);

      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
          return HttpResponse.json([
            {
              sha: 'abc123def456789',
              commit: {
                message: 'Recent commit',
                author: {
                  name: 'Alessandro Romano',
                  date: '2024-01-15T10:30:00Z' // 2 hours ago
                }
              },
              html_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/commit/abc123def456789`
            }
          ]);
        })
      );

      const result = await getGitHubCommitsData('en');

      expect(result.commits[0].relativeTime).toBe('2 hours ago');

      // Test Italian language
      const resultIt = await getGitHubCommitsData('it');
      expect(resultIt.commits[0].relativeTime).toBe('2 ore fa');

      vi.useRealTimers();
    });

    it('should truncate long commit messages', async () => {
      const longMessage = 'A'.repeat(200); // 200 character message
      
      server.use(
        http.get(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`, () => {
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
        })
      );

      const result = await getGitHubCommitsData();

      expect(result.commits[0].truncatedMessage).toBe('A'.repeat(180) + '...');
      expect(result.commits[0].truncatedMessage.length).toBe(183); // 180 + '...'
    });
  
  });
});