// Door 1 — source_analytics platform gate.
//
// The route gates the whole Door-1 diagnose flow behind `source_analytics` — a
// platform-policy flag. This asserts the exact predicate the route branches on:
// every tenant now gets the analytics shell and Door 1 surface; this must not
// silently regress to the old tenant-only Lakeshore enrollment.

import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';

describe('Door 1 · source_analytics gate', () => {
  const ENROLL_ENV = 'ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS';
  const original = process.env[ENROLL_ENV];

  afterEach(() => {
    if (original === undefined) delete process.env[ENROLL_ENV];
    else process.env[ENROLL_ENV] = original;
  });

  it('is ON for every real tenant without an env allowlist', () => {
    delete process.env[ENROLL_ENV];
    expect(
      isFeatureEnabled({ clientKey: 'lakeshore' }, 'source_analytics'),
    ).toBe(true);
    expect(
      isFeatureEnabled({ clientKey: 'skyharbor' }, 'source_analytics'),
    ).toBe(true);
    expect(
      isFeatureEnabled({ clientKey: 'arcturus' }, 'source_analytics'),
    ).toBe(true);
  });

  it('stays ON when the tenant context cannot be resolved', () => {
    delete process.env[ENROLL_ENV];
    expect(isFeatureEnabled(null, 'source_analytics')).toBe(true);
    expect(isFeatureEnabled({}, 'source_analytics')).toBe(true);
  });

  it('does not depend on the retired tenant env allowlist', () => {
    process.env[ENROLL_ENV] = 'lakeshore';
    expect(
      isFeatureEnabled({ clientKey: 'lakeshore' }, 'source_analytics'),
    ).toBe(true);
    expect(
      isFeatureEnabled({ clientKey: 'skyharbor' }, 'source_analytics'),
    ).toBe(true);
  });
});
