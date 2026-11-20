import { open as geolite2Open, GeoIpDbName } from 'geolite2-redist';
import maxmind, { type CountryResponse } from 'maxmind';

interface CountryReader {
  get(ip: string): CountryResponse | null;
  close(): void;
}

let readerPromise: Promise<CountryReader> | null = null;

function getReader(): Promise<CountryReader> {
  if (!readerPromise) {
    readerPromise = geolite2Open(
      GeoIpDbName.Country,
      (path: string) => maxmind.open<CountryResponse>(path)
    ).catch((error: unknown) => {
      readerPromise = null;
      throw error;
    });
  }
  return readerPromise;
}

export async function getCountryFromIP(ip: string): Promise<string | null> {
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

export async function closeGeoIPReader(): Promise<void> {
  if (readerPromise) {
    try {
      const reader = await readerPromise;
      reader.close();
    } catch {
    }
    readerPromise = null;
  }
}
