import { open as geolite2Open, GeoIpDbName } from 'geolite2-redist';
import maxmind, { type CountryResponse } from 'maxmind';

interface CountryReader {
  get(ip: string): CountryResponse | null;
  close(): void;
}

let readerPromise: Promise<CountryReader> | null = null;

/**
 * Get or initialize the singleton GeoIP Country reader.
 * 
 * Uses geolite2-redist which bundles MaxMind's GeoLite2 free databases
 * without requiring a license key. The .mmdb file (~6MB) is read locally
 * from disk — no external API calls, no rate limits.
 * 
 * The reader is initialized lazily on first call and reused for all
 * subsequent lookups within the same process lifecycle.
 */
function getReader(): Promise<CountryReader> {
  if (!readerPromise) {
    readerPromise = geolite2Open(
      GeoIpDbName.Country,
      (path: string) => maxmind.open<CountryResponse>(path)
    ).catch((error: unknown) => {
      // Reset promise so next call retries
      readerPromise = null;
      throw error;
    });
  }
  return readerPromise;
}

/**
 * Resolve an IP address to a 2-letter ISO country code.
 * 
 * Uses a local MaxMind GeoLite2-Country database — no external API calls.
 * Returns null if the IP cannot be resolved (e.g. localhost, 'unknown', or invalid IP).
 * 
 * @param ip - IPv4 or IPv6 address string
 * @returns ISO 3166-1 alpha-2 country code (e.g. "IT", "US") or null
 */
export async function getCountryFromIP(ip: string): Promise<string | null> {
  // Skip obviously unresolvable IPs
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return null;
  }

  try {
    const reader = await getReader();
    const result = reader.get(ip);
    return result?.country?.iso_code ?? null;
  } catch (error) {
    console.error('[GeoIP] Failed to resolve country for IP', ip, error);
    return null;
  }
}

/**
 * Close the GeoIP reader and release resources.
 * Call this on server shutdown for clean cleanup.
 */
export async function closeGeoIPReader(): Promise<void> {
  if (readerPromise) {
    try {
      const reader = await readerPromise;
      // geolite2-redist wraps the reader, close via geolite2
      reader.close();
    } catch {
      // Ignore errors during cleanup
    }
    readerPromise = null;
  }
}
