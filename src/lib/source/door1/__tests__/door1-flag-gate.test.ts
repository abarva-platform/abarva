// Door 1 — the flag-off gate.
//
// The route gates the whole Door-1 diagnose flow behind `source_analytics` — a
// tenant-policy flag with an empty include-list (ships dark). This asserts the
// exact predicate the route branches on: for any real tenant, with no env
// allowlist, the flag is OFF, so the route 404s and Door 1 is not observable.

import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';

describe('Door 1 · source_analytics gate', () => {
  const ENROLL_ENV = 'ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS';
  const original = process.env[ENROLL_ENV];

  afterEach(() => {
    if (original === undefined) delete process.env[ENROLL_ENV];
    else process.env[ENROLL_ENV] = original;
  });

  it('is OFF for a real tenant when not enrolled (route would 404)', () => {
    delete process.env[ENROLL_ENV];
    expect(
      isFeatureEnabled({ clientKey: 'lakeshore' }, 'source_analytics'),
    ).toBe(false);
    expect(
      isFeatureEnabled({ clientKey: 'skyharbor' }, 'source_analytics'),
    ).toBe(false);
  });

  it('is OFF when the tenant context cannot be resolved', () => {
    delete process.env[ENROLL_ENV];
    expect(isFeatureEnabled(null, 'source_analytics')).toBe(false);
    expect(isFeatureEnabled({}, 'source_analytics')).toBe(false);
  });

  it('flips ON only for a tenant explicitly enrolled via env allowlist', () => {
    process.env[ENROLL_ENV] = 'lakeshore';
    expect(
      isFeatureEnabled({ clientKey: 'lakeshore' }, 'source_analytics'),
    ).toBe(true);
    // A different, un-enrolled tenant stays off.
    expect(
      isFeatureEnabled({ clientKey: 'skyharbor' }, 'source_analytics'),
    ).toBe(false);
  });
});
