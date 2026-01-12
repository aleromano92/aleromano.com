import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldRespectPrivacy } from './analytics';

describe('shouldRespectPrivacy', () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    // Save original navigator
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    // Restore original navigator
    global.navigator = originalNavigator;
    vi.unstubAllGlobals();
  });

  describe('Global Privacy Control (GPC)', () => {
    it('should return true when GPC is enabled', () => {
      // Mock navigator with GPC enabled
      vi.stubGlobal('navigator', {
        globalPrivacyControl: true,
        doNotTrack: null,
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return false when GPC is false', () => {
      // Mock navigator with GPC disabled
      vi.stubGlobal('navigator', {
        globalPrivacyControl: false,
        doNotTrack: null,
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });

    it('should return false when GPC is not supported', () => {
      // Mock navigator without GPC property
      vi.stubGlobal('navigator', {
        doNotTrack: null,
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });
  });

  describe('Do Not Track (DNT)', () => {
    it('should return true when DNT is "1" (Chrome/Firefox)', () => {
      // Mock navigator with DNT = '1'
      vi.stubGlobal('navigator', {
        doNotTrack: '1',
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return true when DNT is "yes" (Safari/older IE)', () => {
      // Mock navigator with DNT = 'yes'
      vi.stubGlobal('navigator', {
        doNotTrack: 'yes',
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return false when DNT is "0" (explicitly disabled)', () => {
      // Mock navigator with DNT = '0'
      vi.stubGlobal('navigator', {
        doNotTrack: '0',
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });

    it('should return false when DNT is null (not set)', () => {
      // Mock navigator with DNT = null
      vi.stubGlobal('navigator', {
        doNotTrack: null,
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });

    it('should return false when DNT is undefined (not supported)', () => {
      // Mock navigator with DNT = undefined
      vi.stubGlobal('navigator', {
        doNotTrack: undefined,
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });

    it('should return false when DNT is unrelated string value', () => {
      // Mock navigator with DNT = some other value
      vi.stubGlobal('navigator', {
        doNotTrack: 'unspecified',
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });
  });

  describe('Combined privacy signals', () => {
    it('should return true if both GPC and DNT are enabled', () => {
      // Mock navigator with both GPC and DNT enabled
      vi.stubGlobal('navigator', {
        globalPrivacyControl: true,
        doNotTrack: '1',
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return true if only GPC is enabled (DNT disabled)', () => {
      // Mock navigator with GPC enabled but DNT disabled
      vi.stubGlobal('navigator', {
        globalPrivacyControl: true,
        doNotTrack: '0',
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return true if only DNT is enabled (no GPC support)', () => {
      // Mock navigator without GPC but DNT enabled
      vi.stubGlobal('navigator', {
        doNotTrack: 'yes',
      });

      expect(shouldRespectPrivacy()).toBe(true);
    });

    it('should return false when both signals are disabled', () => {
      // Mock navigator with both GPC and DNT disabled
      vi.stubGlobal('navigator', {
        globalPrivacyControl: false,
        doNotTrack: '0',
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });

    it('should return false when neither signal is set', () => {
      // Mock navigator with neither GPC nor DNT set
      vi.stubGlobal('navigator', {
        doNotTrack: null,
      });

      expect(shouldRespectPrivacy()).toBe(false);
    });
  });
});
