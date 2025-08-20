import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getGitHubCommitsData } from './github';
import type { GitHubCommit, GitHubCommitsData } from './github';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('GitHub API utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
  });

  describe('getGitHubCommitsData', () => {
    it('should return commits when API call is successful', async () => {
      const mockEvents = [
        {
          type: 'PushEvent',
          created_at: '2024-01-15T10:30:00Z',
          repo: { name: 'user/test-repo' },
          payload: {
            commits: [
              {
                sha: 'abc123def456789',
                message: 'Add new feature\n\nDetailed description here',
                author: { name: 'Test User' }
              },
              {
                sha: 'def456abc123789',
                message: 'Fix bug in component',
                author: { name: 'Test User' }
              }
            ]
          }
        },
        {
          type: 'PushEvent',
          created_at: '2024-01-14T15:20:00Z',
          repo: { name: 'user/another-repo' },
          payload: {
            commits: [
              {
                sha: 'xyz789abc123def',
                message: 'Update documentation',
                author: { name: 'Test User' }
              }
            ]
          }
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
      });

      const result: GitHubCommitsData = await getGitHubCommitsData();

      expect(result.error).toBeUndefined();
      expect(result.commits).toHaveLength(3);
      
      // Check first commit details
      expect(result.commits[0]).toEqual({
        sha: 'abc123d',
        message: 'Add new feature',
        date: '2024-01-15T10:30:00Z',
        url: 'https://github.com/user/test-repo/commit/abc123def456789',
        repo: 'user/test-repo'
      });

      // Check that commits are sorted by date (newest first)
      const firstCommitDate = new Date(result.commits[0].date);
      const lastCommitDate = new Date(result.commits[result.commits.length - 1].date);
      expect(firstCommitDate.getTime()).toBeGreaterThanOrEqual(lastCommitDate.getTime());
    });

    it('should filter out merge commits', async () => {
      const mockEvents = [
        {
          type: 'PushEvent',
          created_at: '2024-01-15T10:30:00Z',
          repo: { name: 'user/test-repo' },
          payload: {
            commits: [
              {
                sha: 'abc123def456789',
                message: 'Merge pull request #123 from feature-branch',
                author: { name: 'Test User' }
              },
              {
                sha: 'def456abc123789',
                message: 'Add actual feature',
                author: { name: 'Test User' }
              }
            ]
          }
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
      });

      const result = await getGitHubCommitsData();

      expect(result.commits).toHaveLength(1);
      expect(result.commits[0].message).toBe('Add actual feature');
      expect(result.commits[0].message).not.toContain('Merge');
    });

    it('should filter out commits without author names', async () => {
      const mockEvents = [
        {
          type: 'PushEvent',
          created_at: '2024-01-15T10:30:00Z',
          repo: { name: 'user/test-repo' },
          payload: {
            commits: [
              {
                sha: 'abc123def456789',
                message: 'Commit without author',
                author: null
              },
              {
                sha: 'def456abc123789',
                message: 'Commit with author',
                author: { name: 'Test User' }
              }
            ]
          }
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
      });

      const result = await getGitHubCommitsData();

      expect(result.commits).toHaveLength(1);
      expect(result.commits[0].message).toBe('Commit with author');
    });

    it('should ignore non-PushEvent events', async () => {
      const mockEvents = [
        {
          type: 'IssuesEvent',
          created_at: '2024-01-15T10:30:00Z',
          repo: { name: 'user/test-repo' }
        },
        {
          type: 'PushEvent',
          created_at: '2024-01-15T10:30:00Z',
          repo: { name: 'user/test-repo' },
          payload: {
            commits: [
              {
                sha: 'abc123def456789',
                message: 'Valid commit',
                author: { name: 'Test User' }
              }
            ]
          }
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
      });

      const result = await getGitHubCommitsData();

      expect(result.commits).toHaveLength(1);
      expect(result.commits[0].message).toBe('Valid commit');
    });

    it('should limit results to 10 commits', async () => {
      const mockCommits = Array.from({ length: 15 }, (_, i) => ({
        sha: `commit${i}abc123def456789`,
        message: `Commit ${i}`,
        author: { name: 'Test User' }
      }));
      const mockEvents = [
        {
          type: 'PushEvent',
          created_at: '2024-01-15T10:30:00Z',
          repo: { name: 'user/test-repo' },
          payload: { commits: mockCommits }
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
      });

      const result = await getGitHubCommitsData();

      expect(result.commits).toHaveLength(10);
    });

    it('should truncate SHA to 7 characters', async () => {
      const mockEvents = [
        {
          type: 'PushEvent',
          created_at: '2024-01-15T10:30:00Z',
          repo: { name: 'user/test-repo' },
          payload: {
            commits: [
              {
                sha: 'abcdef123456789fullhash',
                message: 'Test commit',
                author: { name: 'Test User' }
              }
            ]
          }
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
      });

      const result = await getGitHubCommitsData();

      expect(result.commits[0].sha).toBe('abcdef1');
      expect(result.commits[0].sha).toHaveLength(7);
    });

    it('should use only first line of commit message', async () => {
      const mockEvents = [
        {
          type: 'PushEvent',
          created_at: '2024-01-15T10:30:00Z',
          repo: { name: 'user/test-repo' },
          payload: {
            commits: [
              {
                sha: 'abc123def456789',
                message: 'First line of commit\n\nSecond line\nThird line',
                author: { name: 'Test User' }
              }
            ]
          }
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
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

    it('should include correct URL format', async () => {
      const mockEvents = [
        {
          type: 'PushEvent',
          created_at: '2024-01-15T10:30:00Z',
          repo: { name: 'username/repository-name' },
          payload: {
            commits: [
              {
                sha: 'abc123def456789',
                message: 'Test commit',
                author: { name: 'Test User' }
              }
            ]
          }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents
      });

      const result = await getGitHubCommitsData();

      expect(result.commits[0].url).toBe('https://github.com/username/repository-name/commit/abc123def456789');
    });

    it('should make API call with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await getGitHubCommitsData();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/users/aleromano92/events/public',
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'aleromano.com'
          }
        }
      );
    });
  });
});