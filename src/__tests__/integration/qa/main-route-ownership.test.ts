// SHELL2 · Integration tests for main-route-ownership.ts
// No jsdom, no React — pure TypeScript data model tests.

import {
  buildMainRouteOwnershipMap,
  getRoutesNeedingRemediation,
  summarizeRouteOwnership,
} from '@/lib/qa/main-route-ownership';

describe('buildMainRouteOwnershipMap', () => {
  it('returns at least 10 records', () => {
    const records = buildMainRouteOwnershipMap();
    expect(records.length).toBeGreaterThanOrEqual(10);
  });

  it('every record has a non-empty routePattern', () => {
    const records = buildMainRouteOwnershipMap();
    for (const record of records) {
      expect(typeof record.routePattern).toBe('string');
      expect(record.routePattern.length).toBeGreaterThan(0);
    }
  });

  it('every record has a shellCompliance field', () => {
    const valid: string[] = ['canonical', 'legacy', 'mixed', 'unknown', 'deferred'];
    const records = buildMainRouteOwnershipMap();
    for (const record of records) {
      expect(valid).toContain(record.shellCompliance);
    }
  });

  it('every record has a non-empty remediation string', () => {
    const records = buildMainRouteOwnershipMap();
    for (const record of records) {
      expect(typeof record.remediation).toBe('string');
      expect(record.remediation.length).toBeGreaterThan(0);
    }
  });

  it('every record has riskLevel in allowed set', () => {
    const valid: string[] = ['low', 'medium', 'high'];
    const records = buildMainRouteOwnershipMap();
    for (const record of records) {
      expect(valid).toContain(record.riskLevel);
    }
  });

  it('every record has deterministicSeed: true', () => {
    const records = buildMainRouteOwnershipMap();
    for (const record of records) {
      expect(record.deterministicSeed).toBe(true);
    }
  });

  it('apex-retail programs route is present', () => {
    const records = buildMainRouteOwnershipMap();
    const found = records.find(
      (r) => r.routePattern === '/tenant/[tenantSlug]/programs',
    );
    expect(found).toBeDefined();
    expect(found?.tenantDataRichness).toBe('rich');
  });

  it('source events detail route is present', () => {
    const records = buildMainRouteOwnershipMap();
    const found = records.find(
      (r) => r.routePattern === '/source/events/[eventId]',
    );
    expect(found).toBeDefined();
    expect(found?.routeFile).toContain('source/events');
  });
});

describe('getRoutesNeedingRemediation', () => {
  it('returns a subset of the full map', () => {
    const full = buildMainRouteOwnershipMap();
    const needsWork = getRoutesNeedingRemediation();
    expect(needsWork.length).toBeLessThanOrEqual(full.length);
    for (const record of needsWork) {
      const inFull = full.some((r) => r.routePattern === record.routePattern);
      expect(inFull).toBe(true);
    }
  });

  it('returns only non-canonical records', () => {
    const needsWork = getRoutesNeedingRemediation();
    for (const record of needsWork) {
      expect(record.shellCompliance).not.toBe('canonical');
    }
  });
});

describe('summarizeRouteOwnership', () => {
  it('total equals buildMainRouteOwnershipMap().length', () => {
    const summary = summarizeRouteOwnership();
    expect(summary.total).toBe(buildMainRouteOwnershipMap().length);
  });

  it('counts sum correctly across statuses', () => {
    const summary = summarizeRouteOwnership();
    const statusSum =
      summary.canonical +
      summary.legacy +
      summary.mixed +
      summary.unknown +
      summary.deferred;
    expect(statusSum).toBe(summary.total);
  });

  it('has non-negative counts for all buckets', () => {
    const summary = summarizeRouteOwnership();
    expect(summary.canonical).toBeGreaterThanOrEqual(0);
    expect(summary.legacy).toBeGreaterThanOrEqual(0);
    expect(summary.mixed).toBeGreaterThanOrEqual(0);
    expect(summary.unknown).toBeGreaterThanOrEqual(0);
    expect(summary.deferred).toBeGreaterThanOrEqual(0);
    expect(summary.highRisk).toBeGreaterThanOrEqual(0);
  });

  it('majority of routes are canonical (no widespread legacy regression)', () => {
    const summary = summarizeRouteOwnership();
    expect(summary.canonical).toBeGreaterThan(summary.legacy + summary.mixed);
  });
});
