/**
 * mode-inference · CB-6 unit tests
 *
 * Verifies `inferModeForSurface` against the surface→mode mapping
 * spec'd in CONTEXT_BROKER_DESIGN.md §4.
 */

import {
  inferModeForSurface,
  isBrokerMode,
  isModeValidForAuth,
} from '../mode-inference';

jest.mock('server-only', () => ({}));

describe('inferModeForSurface · CB-6', () => {
  describe('/programs/<id>', () => {
    it('returns "full" when tenantKey present', () => {
      expect(
        inferModeForSurface({ surface: '/programs/APX-CDP-2026', tenantKey: 'apex-retail' }),
      ).toBe('full');
    });

    it('returns "generic" without tenantKey (cold visitor)', () => {
      expect(
        inferModeForSurface({ surface: '/programs/APX-CDP-2026', tenantKey: null }),
      ).toBe('generic');
    });
  });

  describe('/programs/new', () => {
    it('returns "tenant" (origination uses tenant context)', () => {
      expect(
        inferModeForSurface({ surface: '/programs/new', tenantKey: 'apex-retail' }),
      ).toBe('tenant');
    });

    it('also matches /demo/programs/new', () => {
      expect(
        inferModeForSurface({ surface: '/demo/programs/new', tenantKey: 'apex-retail' }),
      ).toBe('tenant');
    });
  });

  describe('/intelligence', () => {
    it('returns "corpus" with tenantKey', () => {
      expect(
        inferModeForSurface({ surface: '/intelligence', tenantKey: 'apex-retail' }),
      ).toBe('corpus');
    });

    it('returns "corpus" without tenantKey', () => {
      expect(
        inferModeForSurface({ surface: '/intelligence', tenantKey: null }),
      ).toBe('corpus');
    });

    it('returns "corpus" for nested intelligence routes', () => {
      expect(
        inferModeForSurface({ surface: '/intelligence/patterns/pat-prg-cdp-001', tenantKey: 'x' }),
      ).toBe('corpus');
    });
  });

  describe('/tower', () => {
    it('returns "full" with tenantKey', () => {
      expect(
        inferModeForSurface({ surface: '/tower', tenantKey: 'apex-retail' }),
      ).toBe('full');
    });

    it('returns "generic" without tenantKey', () => {
      expect(
        inferModeForSurface({ surface: '/tower', tenantKey: null }),
      ).toBe('generic');
    });
  });

  describe('/source', () => {
    it('returns "corpus" (sourcing is comparative)', () => {
      expect(
        inferModeForSurface({ surface: '/source', tenantKey: 'apex-retail' }),
      ).toBe('corpus');
    });

    it('returns "corpus" for nested source routes', () => {
      expect(
        inferModeForSurface({ surface: '/source/event-123', tenantKey: 'apex-retail' }),
      ).toBe('corpus');
    });
  });

  describe('/home', () => {
    it('returns "tenant" with tenantKey', () => {
      expect(
        inferModeForSurface({ surface: '/home', tenantKey: 'apex-retail' }),
      ).toBe('tenant');
    });

    it('returns "generic" without tenantKey', () => {
      expect(
        inferModeForSurface({ surface: '/home', tenantKey: null }),
      ).toBe('generic');
    });
  });

  describe('cold start', () => {
    it('returns "generic" when surface is empty and no tenantKey', () => {
      expect(inferModeForSurface({ surface: '', tenantKey: null })).toBe('generic');
    });

    it('returns "generic" when surface is undefined and no tenantKey', () => {
      expect(inferModeForSurface({ surface: undefined, tenantKey: undefined })).toBe(
        'generic',
      );
    });

    it('returns "tenant" when no surface but tenantKey present', () => {
      expect(inferModeForSurface({ surface: undefined, tenantKey: 'apex-retail' })).toBe(
        'tenant',
      );
    });
  });

  describe('unknown surface', () => {
    it('falls back to tenant when tenantKey present', () => {
      expect(
        inferModeForSurface({ surface: '/some/unknown/path', tenantKey: 'apex-retail' }),
      ).toBe('tenant');
    });

    it('falls back to generic when tenantKey absent', () => {
      expect(
        inferModeForSurface({ surface: '/some/unknown/path', tenantKey: null }),
      ).toBe('generic');
    });
  });
});

describe('isModeValidForAuth · CB-6', () => {
  it('accepts generic / corpus regardless of tenantKey', () => {
    expect(isModeValidForAuth('generic', null)).toBe(true);
    expect(isModeValidForAuth('corpus', null)).toBe(true);
    expect(isModeValidForAuth('generic', 'apex-retail')).toBe(true);
    expect(isModeValidForAuth('corpus', 'apex-retail')).toBe(true);
  });

  it('requires tenantKey for tenant / full', () => {
    expect(isModeValidForAuth('tenant', null)).toBe(false);
    expect(isModeValidForAuth('full', null)).toBe(false);
    expect(isModeValidForAuth('tenant', '')).toBe(false);
    expect(isModeValidForAuth('full', '   ')).toBe(false);
  });

  it('admits tenant / full when tenantKey is non-empty', () => {
    expect(isModeValidForAuth('tenant', 'apex-retail')).toBe(true);
    expect(isModeValidForAuth('full', 'apex-retail')).toBe(true);
  });
});

describe('isBrokerMode · CB-6', () => {
  it('returns true for the four valid mode strings', () => {
    expect(isBrokerMode('generic')).toBe(true);
    expect(isBrokerMode('corpus')).toBe(true);
    expect(isBrokerMode('tenant')).toBe(true);
    expect(isBrokerMode('full')).toBe(true);
  });

  it('returns false for anything else', () => {
    expect(isBrokerMode('FULL')).toBe(false);
    expect(isBrokerMode('partial')).toBe(false);
    expect(isBrokerMode(null)).toBe(false);
    expect(isBrokerMode(undefined)).toBe(false);
    expect(isBrokerMode(42)).toBe(false);
    expect(isBrokerMode({})).toBe(false);
  });
});
