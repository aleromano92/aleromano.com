import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getGitHubCommitsData } from './github';
import type { GitHubCommitsData } from './github';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('GitHub Repository Commits API utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
  });

  describe('getGitHubCommitsData', () => {
    it('should return commits when Repository Commits API call is successful', async () => {
      const mockCommits = [
        {
          sha: 'abc123def456789fullhash',
          commit: {
            message: 'Add new feature\n\nDetailed description here',
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-15T10:30:00Z'
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/abc123def456789fullhash'
        },
        {
          sha: 'def456abc123789fullhash',
          commit: {
            message: 'Fix bug in component',
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-14T15:20:00Z'
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/def456abc123789fullhash'
        },
        {
          sha: 'xyz789abc123deffullhash',
          commit: {
            message: 'Update documentation',
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-13T12:10:00Z'
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/xyz789abc123deffullhash'
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits
      });

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
      const mockCommits = [
        {
          sha: 'abc123def456789',
          commit: {
            message: 'Merge pull request #123 from feature-branch',
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-15T10:30:00Z'
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/abc123def456789'
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
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/def456abc123789'
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits
      });

      const result = await getGitHubCommitsData();

      expect(result.commits).toHaveLength(1);
      expect(result.commits[0].message).toBe('Add actual feature');
      expect(result.commits[0].message).not.toContain('Merge');
    });

    it('should truncate SHA to 7 characters', async () => {
      const mockCommits = [
        {
          sha: 'abcdef123456789fullhash',
          commit: {
            message: 'Test commit',
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-15T10:30:00Z'
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/abcdef123456789fullhash'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits
      });

      const result = await getGitHubCommitsData();

      expect(result.commits[0].sha).toBe('abcdef1');
      expect(result.commits[0].sha).toHaveLength(7);
    });

    it('should use only first line of commit message', async () => {
      const mockCommits = [
        {
          sha: 'abc123def456789',
          commit: {
            message: 'First line of commit\n\nSecond line\nThird line',
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-15T10:30:00Z'
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/abc123def456789'
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits
      });

      const result = await getGitHubCommitsData();

      expect(result.commits[0].message).toBe('First line of commit');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await getGitHubCommitsData();

      expect(result.commits).toEqual([]);
      expect(result.error).toBe('Failed to load recent commits');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getGitHubCommitsData();

      expect(result.commits).toEqual([]);
      expect(result.error).toBe('Failed to load recent commits');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should include correct repository name and URL format', async () => {
      const mockCommits = [
        {
          sha: 'abc123def456789',
          commit: {
            message: 'Test commit',
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-15T10:30:00Z'
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/abc123def456789'
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits
      });

      const result = await getGitHubCommitsData();

      expect(result.commits[0].url).toBe('https://github.com/aleromano92/aleromano.com/commit/abc123def456789');
      expect(result.commits[0].repo).toBe('aleromano92/aleromano.com');
    });

    it('should make API call with correct headers and URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await getGitHubCommitsData();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/aleromano92/aleromano.com/commits?per_page=9&author=aleromano92',
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'aleromano.com'
          }
        }
      );
    });

    it('should sort commits by date (newest first)', async () => {
      const mockCommits = [
        {
          sha: 'older123',
          commit: {
            message: 'Older commit',
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-14T10:30:00Z'
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/older123'
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
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/newer456'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits
      });

      const result = await getGitHubCommitsData();

      expect(result.commits[0].sha).toBe('newer45'); // Newer commit first
      expect(result.commits[1].sha).toBe('older12'); // Older commit second
    });

    it('should handle empty response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const result = await getGitHubCommitsData();

      expect(result.commits).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it('should format dates according to language preference', async () => {
      const mockCommits = [
        {
          sha: 'abc123def456789',
          commit: {
            message: 'Test commit',
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-15T10:30:00Z'
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/abc123def456789'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits
      });

      const result = await getGitHubCommitsData('en');

      expect(result.commits[0].formattedDate).toBeDefined();
      expect(typeof result.commits[0].formattedDate).toBe('string');
    });

    it('should include relative time in commit data', async () => {
      // Set a fixed time for consistent testing
      const fixedNow = new Date('2024-01-15T12:30:00Z');
      vi.setSystemTime(fixedNow);

      const mockCommits = [
        {
          sha: 'abc123def456789',
          commit: {
            message: 'Recent commit',
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-15T10:30:00Z' // 2 hours ago
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/abc123def456789'
        }
      ];

      // Mock for English test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits
      });

      const result = await getGitHubCommitsData('en');

      expect(result.commits[0].relativeTime).toBe('2 hours ago');

      // Mock for Italian test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits
      });

      // Test Italian language
      const resultIt = await getGitHubCommitsData('it');
      expect(resultIt.commits[0].relativeTime).toBe('2 ore fa');

      vi.useRealTimers();
    });

    it('should truncate long commit messages', async () => {
      const longMessage = 'A'.repeat(200); // 200 character message
      const mockCommits = [
        {
          sha: 'abc123def456789',
          commit: {
            message: longMessage,
            author: {
              name: 'Alessandro Romano',
              date: '2024-01-15T10:30:00Z'
            }
          },
          html_url: 'https://github.com/aleromano92/aleromano.com/commit/abc123def456789'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits
      });

      const result = await getGitHubCommitsData();

      expect(result.commits[0].truncatedMessage).toBe('A'.repeat(180) + '...');
      expect(result.commits[0].truncatedMessage.length).toBe(183); // 180 + '...'
    });
  
  });
});