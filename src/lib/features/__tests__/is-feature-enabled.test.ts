import { describe, it, expect } from '@jest/globals';
import { isFeatureEnabled } from '../is-feature-enabled';

describe('isFeatureEnabled · A3 feature-flag contract', () => {
  describe('platform-default flags', () => {
    it('is on for every tenant by default', () => {
      expect(isFeatureEnabled({ clientKey: 'apexretail' }, 'intelligence_brief_v4')).toBe(true);
      expect(isFeatureEnabled({ clientKey: 'meridian' }, 'intelligence_brief_v4')).toBe(true);
      expect(isFeatureEnabled({ clientKey: 'arcturus' }, 'intelligence_brief_v4')).toBe(true);
    });

    it('is on when the context is missing a tenant key', () => {
      // Platform-default flags don't require a tenant; they're for everyone.
      expect(isFeatureEnabled(null, 'intelligence_brief_v4')).toBe(true);
      expect(isFeatureEnabled({}, 'intelligence_brief_v4')).toBe(true);
    });
  });

  describe('tenant-default flags', () => {
    it('is off for tenants not in includeTenants', () => {
      expect(
        isFeatureEnabled({ clientKey: 'apexretail' }, 'first_capital_substrate_overlay'),
      ).toBe(false);
      expect(
        isFeatureEnabled({ clientKey: 'meridian' }, 'first_capital_substrate_overlay'),
      ).toBe(false);
    });

    it('is on for tenants in includeTenants', () => {
      expect(
        isFeatureEnabled({ clientKey: 'arcturus' }, 'first_capital_substrate_overlay'),
      ).toBe(true);
    });

    it('is off when the context is missing a tenant key', () => {
      // Tenant-default flags fail closed without a resolved tenant.
      expect(isFeatureEnabled(null, 'first_capital_substrate_overlay')).toBe(false);
      expect(isFeatureEnabled({}, 'first_capital_substrate_overlay')).toBe(false);
    });
  });

  describe('unknown keys', () => {
    it('returns false rather than throwing', () => {
      // Casting to bypass the literal-union check — simulates a typo at a
      // call site that the type checker would normally catch.
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isFeatureEnabled({ clientKey: 'apexretail' }, 'made_up_flag' as any),
      ).toBe(false);
    });
  });
});
