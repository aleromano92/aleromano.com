import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldRespectPrivacy } from './analytics';

describe('shouldRespectPrivacy', () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    vi.unstubAllGlobals();
  });

  describe('Global Privacy Control (GPC)', () => {
    it('should return true when GPC is enabled', () => {
      vi.stubGlobal('navigator', {
        globalPrivacyControl: true,
        doNotTrack: null,
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return false when GPC is false', () => {
      vi.stubGlobal('navigator', {
        globalPrivacyControl: false,
        doNotTrack: null,
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });

    it('should return false when GPC is not supported', () => {
      vi.stubGlobal('navigator', {
        doNotTrack: null,
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });
  });

  describe('Do Not Track (DNT)', () => {
    it('should return true when DNT is "1" (Chrome/Firefox)', () => {
      vi.stubGlobal('navigator', {
        doNotTrack: '1',
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return true when DNT is "yes" (Safari/older IE)', () => {
      vi.stubGlobal('navigator', {
        doNotTrack: 'yes',
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return false when DNT is "0" (explicitly disabled)', () => {
      vi.stubGlobal('navigator', {
        doNotTrack: '0',
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });

    it('should return false when DNT is null (not set)', () => {
      vi.stubGlobal('navigator', {
        doNotTrack: null,
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });

    it('should return false when DNT is undefined (not supported)', () => {
      vi.stubGlobal('navigator', {
        doNotTrack: undefined,
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });

    it('should return false when DNT is unrelated string value', () => {
      vi.stubGlobal('navigator', {
        doNotTrack: 'unspecified',
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });
  });

  describe('Combined privacy signals', () => {
    it('should return true if both GPC and DNT are enabled', () => {
      vi.stubGlobal('navigator', {
        globalPrivacyControl: true,
        doNotTrack: '1',
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return true if only GPC is enabled (DNT disabled)', () => {
      vi.stubGlobal('navigator', {
        globalPrivacyControl: true,
        doNotTrack: '0',
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return true if only DNT is enabled (no GPC support)', () => {
      vi.stubGlobal('navigator', {
        doNotTrack: 'yes',
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return false when both signals are disabled', () => {
      vi.stubGlobal('navigator', {
        globalPrivacyControl: false,
        doNotTrack: '0',
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });

    it('should return false when neither signal is set', () => {
      vi.stubGlobal('navigator', {
        doNotTrack: null,
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });
  });
});
