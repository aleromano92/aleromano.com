import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock geolite2-redist and maxmind before importing the module under test
const mockGet = vi.fn();
const mockClose = vi.fn();
const mockReader = { get: mockGet, close: mockClose };

vi.mock('geolite2-redist', () => ({
  open: vi.fn().mockResolvedValue(mockReader),
  GeoIpDbName: {
    Country: 'GeoLite2-Country',
  },
}));

vi.mock('maxmind', () => ({
  default: {
    open: vi.fn(),
  },
  open: vi.fn(),
  Reader: vi.fn(),
}));

describe('GeoIP utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the module to clear the singleton reader between tests
    vi.resetModules();
  });

  describe('getCountryFromIP', () => {
    it('should return country code for a valid IP', async () => {
      mockGet.mockReturnValue({ country: { iso_code: 'IT' } });
      const { getCountryFromIP } = await import('./geoip');

      const result = await getCountryFromIP('185.194.81.29');

      expect(result).toBe('IT');
      expect(mockGet).toHaveBeenCalledWith('185.194.81.29');
    });

    it('should return null for localhost IPv4', async () => {
      const { getCountryFromIP } = await import('./geoip');

      const result = await getCountryFromIP('127.0.0.1');

      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return null for localhost IPv6', async () => {
      const { getCountryFromIP } = await import('./geoip');

      const result = await getCountryFromIP('::1');

      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return null for "unknown" IP', async () => {
      const { getCountryFromIP } = await import('./geoip');

      const result = await getCountryFromIP('unknown');

      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return null for empty string', async () => {
      const { getCountryFromIP } = await import('./geoip');

      const result = await getCountryFromIP('');

      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return null when maxmind returns null', async () => {
      mockGet.mockReturnValue(null);
      const { getCountryFromIP } = await import('./geoip');

      const result = await getCountryFromIP('10.0.0.1');

      expect(result).toBeNull();
    });

    it('should return null when country is missing from response', async () => {
      mockGet.mockReturnValue({ continent: { code: 'EU' } });
      const { getCountryFromIP } = await import('./geoip');

      const result = await getCountryFromIP('10.0.0.1');

      expect(result).toBeNull();
    });

    it('should return null and log error when reader throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockImplementation(() => { throw new Error('DB read error'); });
      const { getCountryFromIP } = await import('./geoip');

      const result = await getCountryFromIP('8.8.8.8');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[GeoIP] Failed to resolve country for IP',
        '8.8.8.8',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('closeGeoIPReader', () => {
    it('should close the reader when initialized', async () => {
      // First initialize the reader by making a lookup
      mockGet.mockReturnValue({ country: { iso_code: 'US' } });
      const { getCountryFromIP, closeGeoIPReader } = await import('./geoip');
      await getCountryFromIP('8.8.8.8');

      await closeGeoIPReader();

      expect(mockClose).toHaveBeenCalled();
    });

    it('should not throw when no reader is initialized', async () => {
      const { closeGeoIPReader } = await import('./geoip');

      await expect(closeGeoIPReader()).resolves.not.toThrow();
    });
  });
});
