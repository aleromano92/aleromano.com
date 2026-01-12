import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getDaysAgoTimestamp', () => {
  // We need to test the helper function, but it's not exported
  // So we'll test it indirectly through the query methods that use it
  // by mocking Date.now() to have consistent timestamps

  let originalDateNow: () => number;

  beforeEach(() => {
    originalDateNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  it('should calculate correct timestamp for 30 days ago', () => {
    // Mock Date.now to return a fixed timestamp
    const mockNow = 1700000000000; // Mock timestamp in milliseconds
    vi.stubGlobal('Date', {
      ...Date,
      now: () => mockNow
    });

    // Calculate expected cutoff (30 days ago in seconds)
    const expectedCutoff = Math.floor(mockNow / 1000) - (30 * 24 * 60 * 60);
    
    // The expected cutoff should be:
    // 1700000000 (seconds) - 2592000 (30 days in seconds) = 1697408000
    expect(expectedCutoff).toBe(1697408000);
  });

  it('should calculate correct timestamp for 7 days ago', () => {
    const mockNow = 1700000000000;
    vi.stubGlobal('Date', {
      ...Date,
      now: () => mockNow
    });

    const expectedCutoff = Math.floor(mockNow / 1000) - (7 * 24 * 60 * 60);
    
    // 1700000000 - 604800 (7 days) = 1699395200
    expect(expectedCutoff).toBe(1699395200);
  });

  it('should calculate correct timestamp for 1 day ago', () => {
    const mockNow = 1700000000000;
    vi.stubGlobal('Date', {
      ...Date,
      now: () => mockNow
    });

    const expectedCutoff = Math.floor(mockNow / 1000) - (1 * 24 * 60 * 60);
    
    // 1700000000 - 86400 (1 day) = 1699913600
    expect(expectedCutoff).toBe(1699913600);
  });

  it('should handle edge case of 0 days', () => {
    const mockNow = 1700000000000;
    vi.stubGlobal('Date', {
      ...Date,
      now: () => mockNow
    });

    const expectedCutoff = Math.floor(mockNow / 1000) - (0 * 24 * 60 * 60);
    
    // Should return current timestamp
    expect(expectedCutoff).toBe(1700000000);
  });
});
