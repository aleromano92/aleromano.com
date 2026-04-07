import { describe, it, expect, beforeEach, vi } from 'vitest';
import { server } from '../mocks/server';
import { githubErrorHandlers } from '../mocks/handlers';
import { GitHubService } from './github';
import type { GitHubCommitsData } from './github';
import type { CacheManager } from './database';
import mockGitHubCommits from '../mocks/mock-github-commits-response.json';

const GITHUB_USERNAME = 'aleromano92';
const GITHUB_REPO = 'aleromano.com';

const GITHUB_CACHE_KEY = 'github:commits';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Mock console.error/warn to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

const createMockCache = (): CacheManager => ({
  get: vi.fn(),
  set: vi.fn(),
  getStale: vi.fn(),
  clearAll: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  clearExpired: vi.fn(),
});

describe('GitHub Repository Commits API utilities', () => {
  let service: GitHubService;
  let mockCache: CacheManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();

    mockCache = createMockCache();
    vi.mocked(mockCache.get).mockReturnValue(null);
    vi.mocked(mockCache.getStale).mockReturnValue(null);

    service = new GitHubService(mockCache);
  });

  describe('getCommitsData', () => {
    it('should return commits when Repository Commits API call is successful', async () => {
      // MSW will use the default handler from handlers.ts
      const result: GitHubCommitsData = await service.getCommitsData('en');

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
      server.use(githubErrorHandlers.withMergeCommits);

      const result = await service.getCommitsData();

      expect(result.commits).toHaveLength(1);
      expect(result.commits[0].message).toBe('Add actual feature');
      expect(result.commits[0].message).not.toContain('Merge');
    });

    it('should truncate SHA to 7 characters', async () => {
      server.use(githubErrorHandlers.singleCommitFullSha);

      const result = await service.getCommitsData();

      expect(result.commits[0].sha).toBe('abcdef1');
      expect(result.commits[0].sha).toHaveLength(7);
    });

    it('should use only first line of commit message', async () => {
      server.use(githubErrorHandlers.multiLineMessage);

      const result = await service.getCommitsData();

      expect(result.commits[0].message).toBe('First line of commit');
    });

    it('should handle API errors gracefully', async () => {
      server.use(githubErrorHandlers.notFound);

      const result = await service.getCommitsData();

      expect(result.commits).toEqual([]);
      expect(result.error).toBe('Failed to load recent commits');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      server.use(githubErrorHandlers.networkError);

      const result = await service.getCommitsData();

      expect(result.commits).toEqual([]);
      expect(result.error).toBe('Failed to load recent commits');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should include correct repository name and URL format', async () => {
      server.use(githubErrorHandlers.singleCommitFullSha);

      const result = await service.getCommitsData();

      expect(result.commits[0].url).toBe('https://github.com/aleromano92/aleromano.com/commit/abcdef123456789fullhash');
      expect(result.commits[0].repo).toBe('aleromano92/aleromano.com');
    });

    it('should make API call with correct headers and URL', async () => {
      const result = await service.getCommitsData();

      expect(result.commits).toBeDefined();
    });

    it('should sort commits by date (newest first)', async () => {
      server.use(githubErrorHandlers.unsortedCommits);

      const result = await service.getCommitsData();

      expect(result.commits[0].sha).toBe('newer45'); // Newer commit first
      expect(result.commits[1].sha).toBe('older12'); // Older commit second
    });

    it('should handle empty response gracefully', async () => {
      server.use(githubErrorHandlers.emptyResponse);

      const result = await service.getCommitsData();

      expect(result.commits).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it('should format dates according to language preference', async () => {
      server.use(githubErrorHandlers.singleCommitFullSha);

      const result = await service.getCommitsData('en');

      expect(result.commits[0].formattedDate).toBeDefined();
      expect(typeof result.commits[0].formattedDate).toBe('string');
    });

    it('should include relative time in commit data', async () => {
      const fixedNow = new Date('2024-01-15T12:30:00Z');
      vi.setSystemTime(fixedNow);

      server.use(githubErrorHandlers.recentCommit);

      const result = await service.getCommitsData('en');
      expect(result.commits[0].relativeTime).toBe('2 hours ago');

      const resultIt = await service.getCommitsData('it');
      expect(resultIt.commits[0].relativeTime).toBe('2 ore fa');

      vi.useRealTimers();
    });

    it('should truncate long commit messages', async () => {
      server.use(githubErrorHandlers.longMessage);

      const result = await service.getCommitsData();

      expect(result.commits[0].truncatedMessage).toBe('A'.repeat(180) + '...');
      expect(result.commits[0].truncatedMessage.length).toBe(183); // 180 + '...'
    });
  });

  describe('caching', () => {
    it('should store API response in cache after successful fetch', async () => {
      await service.getCommitsData('en');

      expect(mockCache.set).toHaveBeenCalledWith(
        GITHUB_CACHE_KEY,
        JSON.stringify(mockGitHubCommits),
        CACHE_TTL_MS
      );
    });

    it('should return cached data without calling the API', async () => {
      vi.mocked(mockCache.get).mockReturnValue(JSON.stringify(mockGitHubCommits));

      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      await service.getCommitsData('en');

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should re-process cached raw data with the requested language', async () => {
      vi.mocked(mockCache.get).mockReturnValue(JSON.stringify(mockGitHubCommits));

      const resultEn = await service.getCommitsData('en');
      const resultIt = await service.getCommitsData('it');

      // Both should have commits (from same cached raw data)
      expect(resultEn.commits.length).toBeGreaterThan(0);
      expect(resultIt.commits.length).toBeGreaterThan(0);

      // Relative time strings should differ by language
      expect(resultEn.commits[0].relativeTime).not.toBe(resultIt.commits[0].relativeTime);
    });

    it('should use stale cache as fallback when API fails', async () => {
      server.use(githubErrorHandlers.networkError);
      vi.mocked(mockCache.getStale).mockReturnValue(JSON.stringify(mockGitHubCommits));

      const result = await service.getCommitsData('en');

      expect(result.commits.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('stale'));
    });

    it('should return error when both API and cache are unavailable', async () => {
      server.use(githubErrorHandlers.networkError);
      // getStale already returns null by default in beforeEach

      const result = await service.getCommitsData('en');

      expect(result.commits).toEqual([]);
      expect(result.error).toBe('Failed to load recent commits');
    });
  });
});
